// Server-side reliability helpers for Groq.
//
// Imported by the Supabase edge function (supabase/functions/generate-comments)
// and exercised by unit tests. Pure TypeScript: no secrets, no environment
// access, and nothing client-specific lives here.
//
// Responsibilities:
//   - discover available Groq models and cache the list server-side (TTL)
//   - select a compatible model deterministically, preserving preference order
//   - fall back to another model when the selected one is unavailable
//   - respect `Retry-After`, otherwise use bounded exponential backoff + jitter
//   - handle transient failures (network, 5xx) with bounded retries
//   - fail gracefully instead of crashing or retrying forever

export const MODEL_CACHE_TTL_MS = 30 * 60 * 1000;
export const MAX_RETRY_DELAY_MS = 10 * 1000;
export const MAX_429_RETRIES = 2;
export const MAX_TRANSIENT_RETRIES = 1;
const MAX_MODEL_PASSES = 2;

export class GroqError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqError";
  }
}

export class GroqHttpError extends GroqError {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GroqHttpError";
  }
}

export class GroqRateLimitError extends GroqError {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "GroqRateLimitError";
  }
}

export class GroqModelNotFoundError extends GroqError {
  constructor(model: string) {
    super(`Model "${model}" is not available.`);
    this.name = "GroqModelNotFoundError";
  }
}

export class GroqNetworkError extends GroqError {
  constructor(label: string) {
    super(`${label} is temporarily unreachable. Please try again later.`);
    this.name = "GroqNetworkError";
  }
}

interface ModelCache {
  fetchedAt: number;
  models: string[];
}

let modelCache: ModelCache | null = null;

/** Test helper: clear the in-memory model cache. */
export function resetGroqModelCache(): void {
  modelCache = null;
}

/** Derive the model-list URL from a chat/completions base URL. */
export function modelsUrlFor(chatCompletionsUrl: string): string {
  return chatCompletionsUrl.replace(/\/chat\/completions\/?$/, "/models");
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function parseRetryAfter(header: string | null | undefined): number | undefined {
  if (!header) return undefined;
  const value = Number.parseInt(header, 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Delay before the next retry. Respects a provider-provided `Retry-After`
 * (capped so we never sleep indefinitely); otherwise bounded exponential
 * backoff with jitter.
 */
export function getRetryDelayMs(
  retryAfterSeconds: number | undefined,
  attempt: number,
): number {
  if (retryAfterSeconds !== undefined && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS);
  }
  const baseDelay = Math.min(500 * 2 ** attempt, MAX_RETRY_DELAY_MS);
  return baseDelay + Math.floor(Math.random() * 250);
}

/** Sleep for `ms`, resolving early only on success; rejects with AbortError on abort. */
export function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (signal?.aborted) {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal?.addEventListener("abort", onAbort);
  });
}

/** Fetch the currently available model ids from the Groq API. */
export async function fetchGroqModels(
  apiKey: string,
  chatCompletionsUrl: string,
  signal: AbortSignal,
): Promise<string[]> {
  const response = await fetch(modelsUrlFor(chatCompletionsUrl), {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!response.ok) {
    throw new GroqHttpError(
      `Failed to fetch Groq models (${response.status})`,
      response.status,
    );
  }
  const body = (await response.json()) as { data?: { id?: unknown }[] };
  const raw = Array.isArray(body?.data) ? body.data : [];
  return raw
    .map((m) => (typeof m?.id === "string" ? m.id : ""))
    .filter((id): id is string => id.length > 0);
}

/** Get available models, cached server-side with a TTL. */
export async function getAvailableModels(
  apiKey: string,
  chatCompletionsUrl: string,
  signal: AbortSignal,
  forceRefresh = false,
): Promise<string[]> {
  if (
    !forceRefresh &&
    modelCache !== null &&
    Date.now() - modelCache.fetchedAt < MODEL_CACHE_TTL_MS
  ) {
    return modelCache.models;
  }
  const models = await fetchGroqModels(apiKey, chatCompletionsUrl, signal);
  modelCache = { fetchedAt: Date.now(), models };
  return models;
}

const NON_CHAT_MARKERS = [
  "embedding", "whisper", "tts", "stt", "moderation", "rerank",
  "image", "dall-e", "audio",
];

function isPlausibleChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  return !NON_CHAT_MARKERS.some((marker) => lower.includes(marker));
}

/**
 * Deterministic model selection: prefer configured models in order, then a
 * compatible available model. `kind` biases vision-capable models for OCR.
 */
export function selectGroqModel(
  preferred: string[],
  available: string[],
  kind: "text" | "vision" = "text",
): string | null {
  const availableSet = new Set(available);
  const preferredAvailable = preferred.find((m) => availableSet.has(m));
  if (preferredAvailable) return preferredAvailable;

  const candidates = available.filter((id) => {
    if (!isPlausibleChatModel(id)) return false;
    if (kind === "vision") return /vision|scout|multimodal|4-scout|omni/i.test(id);
    return true;
  });

  if (kind === "text") {
    const knownGood = candidates.find((id) => /llama|gpt-oss|qwen|mixtral|gemma/i.test(id));
    if (knownGood) return knownGood;
  }

  return candidates[0] ?? null;
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isModelNotFoundError(bodyText: string, status: number): boolean {
  if (status === 404) return true;
  const parsed = tryParseJson(bodyText);
  if (!parsed) return false;
  const error = parsed.error as Record<string, unknown> | undefined;
  if (!error) return false;
  const message = String(error.message ?? "");
  const code = String(error.code ?? "");
  return (
    code === "model_not_found" ||
    message.includes("model_not_found") ||
    code.includes("not_found")
  );
}

export interface GroqCallOptions {
  chatCompletionsUrl: string;
  apiKey: string;
  preferredModels: string[];
  kind?: "text" | "vision";
  label: string;
  signal: AbortSignal;
  buildBody: (model: string) => Record<string, unknown>;
}

export interface GroqCallResult {
  data: Record<string, unknown>;
  model: string;
}

async function attemptModel(
  options: GroqCallOptions,
  model: string,
): Promise<GroqCallResult> {
  const { chatCompletionsUrl, apiKey, label, signal, buildBody } = options;
  let rateLimitRetries = 0;
  let transientRetries = 0;
  const maxAttempts = 1 + MAX_429_RETRIES + MAX_TRANSIENT_RETRIES;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(chatCompletionsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildBody(model)),
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      if (transientRetries < MAX_TRANSIENT_RETRIES) {
        transientRetries += 1;
        await sleepWithAbort(getRetryDelayMs(undefined, transientRetries - 1), signal);
        continue;
      }
      throw new GroqNetworkError(label);
    }

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      return { data, model };
    }

    const bodyText = await response.text().catch(() => "");

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
      if (rateLimitRetries < MAX_429_RETRIES) {
        rateLimitRetries += 1;
        await sleepWithAbort(getRetryDelayMs(retryAfter, rateLimitRetries - 1), signal);
        continue;
      }
      throw new GroqRateLimitError(
        "AI service is busy. Please wait a moment and try again.",
        retryAfter,
      );
    }

    if (isModelNotFoundError(bodyText, response.status)) {
      throw new GroqModelNotFoundError(model);
    }

    if (response.status >= 500) {
      if (transientRetries < MAX_TRANSIENT_RETRIES) {
        transientRetries += 1;
        await sleepWithAbort(getRetryDelayMs(undefined, transientRetries - 1), signal);
        continue;
      }
      throw new GroqHttpError(
        `${label} is temporarily unavailable (${response.status}).`,
        response.status,
      );
    }

    throw new GroqHttpError(
      `${label} failed (${response.status}): ${bodyText.slice(0, 300)}`,
      response.status,
    );
  }

  throw new GroqError(`${label} failed after retries.`);
}

/**
 * Call Groq with:
 *   - cached model discovery + automatic fallback to another compatible model
 *   - a single model-list refresh when models are rejected
 *   - bounded 429 retries respecting `Retry-After` (with backoff + jitter)
 *   - bounded transient (network / 5xx) retries
 *   - a clear, controlled failure instead of crashing
 */
export async function callGroqWithFallback(
  options: GroqCallOptions,
): Promise<GroqCallResult> {
  const {
    chatCompletionsUrl, apiKey, preferredModels, label, signal,
  } = options;
  const kind = options.kind ?? "text";

  // Best-effort model discovery. If it fails, proceed with the preferred list so
  // a models-endpoint outage can't block generation.
  let available: string[] | null = null;
  try {
    available = await getAvailableModels(apiKey, chatCompletionsUrl, signal);
  } catch (error) {
    if (isAbortError(error)) throw error;
    available = null;
  }

  const selectionFor = (models: string[] | null): string[] => {
    if (models && models.length > 0) {
      const preferred = preferredModels.filter((m) => models.includes(m));
      if (preferred.length > 0) return preferred;
      const fallback = selectGroqModel(preferredModels, models, kind);
      return fallback ? [fallback] : preferredModels;
    }
    return preferredModels;
  };

  let modelsToTry = selectionFor(available);
  const errors: { model: string; reason: string }[] = [];

  for (let pass = 0; pass < MAX_MODEL_PASSES; pass += 1) {
    for (const model of modelsToTry) {
      try {
        return await attemptModel(options, model);
      } catch (error) {
        if (isAbortError(error)) throw error;
        if (error instanceof GroqRateLimitError) throw error;
        if (error instanceof GroqModelNotFoundError) {
          errors.push({ model, reason: "model not available (removed/deprecated)" });
          continue;
        }
        if (error instanceof GroqNetworkError) {
          errors.push({ model, reason: "temporarily unreachable" });
          continue;
        }
        if (error instanceof GroqHttpError) {
          errors.push({ model, reason: `request failed (HTTP ${error.status})` });
          continue;
        }
        throw error;
      }
    }

    // One refresh pass: re-discover models and re-select. Only retry when the
    // selection actually changes to avoid redundant work.
    if (pass === 0) {
      let refreshed: string[] | null = null;
      try {
        refreshed = await getAvailableModels(apiKey, chatCompletionsUrl, signal, true);
      } catch (error) {
        if (isAbortError(error)) throw error;
        refreshed = null;
      }
      const refreshedSelection = selectionFor(refreshed);
      if (refreshedSelection.join(",") === modelsToTry.join(",")) break;
      modelsToTry = refreshedSelection;
    }
  }

  const detail = errors
    .map((e, i) => `  ${i + 1}. "${e.model}" - ${e.reason}`)
    .join("\n");

  throw new GroqError(
    `All AI models failed for ${label}.\nTried:\n${detail}\n\n`
    + "Please try again later or contact support if this persists.",
  );
}
