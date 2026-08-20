import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callGroqWithFallback,
  getAvailableModels,
  getRetryDelayMs,
  modelsUrlFor,
  parseRetryAfter,
  resetGroqModelCache,
  selectGroqModel,
  sleepWithAbort,
  MODEL_CACHE_TTL_MS,
  GroqError,
  GroqRateLimitError,
} from "./groqReliability";

const CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS_URL = "https://api.groq.com/openai/v1/models";
const API_KEY = "test-groq-api-key";

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function createFetchMock(handlers: {
  models?: () => Response | Promise<Response>;
  chat?: (body: { model?: string }) => Response | Promise<Response>;
}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const url = String(input);
    if (url.includes("/models")) {
      return handlers.models ? handlers.models() : jsonResponse({ data: [] });
    }
    if (url.includes("/chat/completions")) {
      const body = init?.body ? (JSON.parse(String(init.body)) as { model?: string }) : {};
      if (handlers.chat) return handlers.chat(body);
      return jsonResponse({ choices: [{ message: { content: "ok" } }] });
    }
    return jsonResponse({}, 404);
  });
}

function makeCallOptions(
  overrides: Partial<Parameters<typeof callGroqWithFallback>[0]> = {},
): Parameters<typeof callGroqWithFallback>[0] {
  return {
    chatCompletionsUrl: CHAT_URL,
    apiKey: API_KEY,
    preferredModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    label: "Comment generation",
    signal: new AbortController().signal,
    buildBody: (model: string) => ({ model, messages: [] }),
    ...overrides,
  };
}

describe("modelsUrlFor", () => {
  it("derives the models URL from the chat completions URL", () => {
    expect(modelsUrlFor(CHAT_URL)).toBe(MODELS_URL);
  });
});

describe("parseRetryAfter", () => {
  it("parses a valid Retry-After header", () => {
    expect(parseRetryAfter("5")).toBe(5);
  });

  it("returns undefined for missing or invalid values", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("abc")).toBeUndefined();
    expect(parseRetryAfter("0")).toBeUndefined();
  });
});

describe("getRetryDelayMs", () => {
  it("respects Retry-After when provided", () => {
    expect(getRetryDelayMs(5, 0)).toBe(5000);
  });

  it("caps Retry-After to avoid sleeping indefinitely", () => {
    expect(getRetryDelayMs(3600, 0)).toBe(10_000);
  });

  it("uses exponential backoff with jitter when no Retry-After is given", () => {
    expect(getRetryDelayMs(undefined, 0)).toBeGreaterThanOrEqual(500);
    expect(getRetryDelayMs(undefined, 0)).toBeLessThan(750);
    expect(getRetryDelayMs(undefined, 1)).toBeGreaterThanOrEqual(1000);
    expect(getRetryDelayMs(undefined, 1)).toBeLessThan(1250);
    expect(getRetryDelayMs(undefined, 2)).toBeGreaterThanOrEqual(2000);
    expect(getRetryDelayMs(undefined, 2)).toBeLessThan(2250);
  });

  it("caps the backoff at the maximum delay", () => {
    expect(getRetryDelayMs(undefined, 10)).toBeGreaterThanOrEqual(10_000);
    expect(getRetryDelayMs(undefined, 10)).toBeLessThan(10_250);
  });
});

describe("getAvailableModels (caching)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGroqModelCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches once and reuses the cache within the TTL", async () => {
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "m1" }, { id: "m2" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    const first = await getAvailableModels(API_KEY, CHAT_URL, signal);
    const second = await getAvailableModels(API_KEY, CHAT_URL, signal);

    expect(first).toEqual(["m1", "m2"]);
    expect(second).toEqual(["m1", "m2"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches after the cache expires", async () => {
    let callCount = 0;
    const fetchMock = createFetchMock({
      models: () => {
        callCount += 1;
        return jsonResponse({ data: [{ id: "m1" }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    await getAvailableModels(API_KEY, CHAT_URL, signal);
    await vi.advanceTimersByTimeAsync(MODEL_CACHE_TTL_MS + 1);
    await getAvailableModels(API_KEY, CHAT_URL, signal);

    expect(callCount).toBe(2);
  });

  it("force refresh bypasses the cache", async () => {
    let callCount = 0;
    const fetchMock = createFetchMock({
      models: () => {
        callCount += 1;
        return jsonResponse({ data: [{ id: "m1" }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    await getAvailableModels(API_KEY, CHAT_URL, signal);
    await getAvailableModels(API_KEY, CHAT_URL, signal, true);

    expect(callCount).toBe(2);
  });
});

describe("selectGroqModel", () => {
  it("prefers a configured model when it is available", () => {
    expect(
      selectGroqModel(
        ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
        ["llama-3.1-8b-instant"],
      ),
    ).toBe("llama-3.1-8b-instant");
  });

  it("excludes non-chat models for text selection", () => {
    const available = ["whisper-large-v3", "text-embedding-3", "llama-3.1-8b-instant"];
    expect(selectGroqModel(["missing-model"], available, "text")).toBe("llama-3.1-8b-instant");
  });

  it("prefers vision-capable models for OCR", () => {
    const available = ["llama-3.1-8b-instant", "meta-llama/llama-4-scout-17b-16e-instruct"];
    expect(selectGroqModel(["missing-model"], available, "vision")).toBe(
      "meta-llama/llama-4-scout-17b-16e-instruct",
    );
  });

  it("returns null when no compatible model exists", () => {
    expect(selectGroqModel(["m"], ["whisper-large-v3"], "text")).toBeNull();
  });
});

describe("callGroqWithFallback", () => {
  beforeEach(() => {
    resetGroqModelCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("succeeds with a normal request using the preferred model", async () => {
    const fetchMock = createFetchMock({
      models: () =>
        jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }, { id: "llama-3.1-8b-instant" }] }),
      chat: (body) => jsonResponse({ choices: [{ message: { content: `hi from ${body.model}` } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqWithFallback(makeCallOptions());

    expect(result.model).toBe("llama-3.3-70b-versatile");
    const choices = result.data.choices as { message?: { content?: string } }[];
    expect(choices[0]?.message?.content).toBe("hi from llama-3.3-70b-versatile");
  });

  it("falls back to the next available preferred model", async () => {
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.1-8b-instant" }] }),
      chat: (body) => jsonResponse({ choices: [{ message: { content: body.model } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqWithFallback(makeCallOptions());

    expect(result.model).toBe("llama-3.1-8b-instant");
  });

  it("selects a compatible available model when none of the preferred are available", async () => {
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "openai/gpt-oss-20b" }] }),
      chat: (body) => jsonResponse({ choices: [{ message: { content: body.model } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqWithFallback(
      makeCallOptions({ preferredModels: ["llama-3.3-70b-versatile"] }),
    );

    expect(result.model).toBe("openai/gpt-oss-20b");
  });

  it("recovers from a 429 by retrying and then succeeding", async () => {
    vi.useFakeTimers();
    let chatCalls = 0;
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => {
        chatCalls += 1;
        if (chatCalls === 1) {
          return jsonResponse({ error: { message: "rate limited" } }, 429, { "retry-after": "1" });
        }
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(chatCalls).toBe(2);
  });

  it("stops retrying after the 429 limit and throws a rate-limit error", async () => {
    vi.useFakeTimers();
    let chatCalls = 0;
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => {
        chatCalls += 1;
        return jsonResponse({ error: { message: "rate limited" } }, 429, { "retry-after": "1" });
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    const assertion = expect(promise).rejects.toThrow(GroqRateLimitError);
    await vi.advanceTimersByTimeAsync(30_000);

    await assertion;
    expect(chatCalls).toBe(3);
  });

  it("recovers from a temporary 5xx by retrying", async () => {
    vi.useFakeTimers();
    let chatCalls = 0;
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => {
        chatCalls += 1;
        if (chatCalls === 1) return jsonResponse({ error: { message: "boom" } }, 503);
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(chatCalls).toBe(2);
  });

  it("recovers from a network failure", async () => {
    vi.useFakeTimers();
    let chatCalls = 0;
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => {
        chatCalls += 1;
        if (chatCalls === 1) throw new TypeError("fetch failed");
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(chatCalls).toBe(2);
  });

  it("fails gracefully (not forever) when all models fail", async () => {
    vi.useFakeTimers();
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => {
        throw new TypeError("fetch failed");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    const assertion = expect(promise).rejects.toThrow(/All AI models failed/);
    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it("degrades gracefully when model discovery fails", async () => {
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ error: { message: "down" } }, 503),
      chat: (body) => jsonResponse({ choices: [{ message: { content: body.model } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqWithFallback(makeCallOptions());

    expect(result.model).toBe("llama-3.3-70b-versatile");
  });

  it("refreshes the model list and retries when the selected model is rejected", async () => {
    vi.useFakeTimers();
    let modelsCalls = 0;
    const fetchMock = createFetchMock({
      models: () => {
        modelsCalls += 1;
        if (modelsCalls === 1) return jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] });
        return jsonResponse({ data: [{ id: "llama-3.1-8b-instant" }] });
      },
      chat: (body) => {
        if (body.model === "llama-3.3-70b-versatile") {
          return jsonResponse(
            { error: { code: "model_not_found", message: "model not found" } },
            404,
          );
        }
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqWithFallback(makeCallOptions());

    expect(result.model).toBe("llama-3.1-8b-instant");
    expect(modelsCalls).toBe(2);
  });

  it("aborts cleanly when the signal is aborted", async () => {
    const controller = new AbortController();
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => jsonResponse({ choices: [{ message: { content: "ok" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    controller.abort();

    await expect(
      callGroqWithFallback(makeCallOptions({ signal: controller.signal })),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("does not leak the API key in failure messages", async () => {
    vi.useFakeTimers();
    const fetchMock = createFetchMock({
      models: () => jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] }),
      chat: () => jsonResponse({ error: { message: "boom" } }, 500),
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = callGroqWithFallback(makeCallOptions());
    const settle = promise.then(
      () => null as unknown,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(10_000);

    const error = await settle;
    expect(error).toBeInstanceOf(GroqError);
    expect(String((error as Error).message)).not.toContain(API_KEY);
  });
});

describe("sleepWithAbort", () => {
  it("rejects with AbortError when aborted while sleeping", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const promise = sleepWithAbort(5000, controller.signal);

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    vi.useRealTimers();
  });
});