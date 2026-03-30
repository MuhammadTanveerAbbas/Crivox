export interface GenerateParams {
  content: string;
  image_base64?: string;
  input_type?: "url" | "text" | "image";
  tone: string;
  length: string;
  platform: string;
  language?: string;
  include_emoji?: boolean;
  include_hashtags?: boolean;
  include_cta?: boolean;
  count?: number;
  single?: boolean;
  variation_number?: number;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function buildPrompt(params: GenerateParams): string {
  const {
    content, input_type = "text", tone, length, platform,
    language = "en", include_emoji, include_hashtags, include_cta,
    count = 3, single, variation_number,
  } = params;

  const lengthGuide =
    length === "Short" ? "1-2 sentences" :
    length === "Long" ? "4-6 sentences" :
    length === "AI Decides" ? "whatever length feels most natural" :
    "2-3 sentences";

  const extras = [
    include_emoji && "include relevant emojis",
    include_hashtags && "include relevant hashtags",
    include_cta && "end with a call-to-action",
  ].filter(Boolean).join(", ");

  const inputDesc =
    input_type === "url" ? `a post at this URL: ${content}` :
    input_type === "image" ? "the provided image" :
    `this post content: "${content}"`;

  const variationNote = single && variation_number
    ? ` This is variation #${variation_number}, make it distinct from previous ones.`
    : "";

  return [
    `You are an expert social media comment writer.`,
    `Generate ${single ? "1" : count} unique, engaging ${tone.toLowerCase()} comment${single ? "" : "s"} for ${inputDesc}.`,
    `Platform: ${platform}. Length: ${lengthGuide}. Language: ${language}.`,
    extras && `Requirements: ${extras}.`,
    variationNote,
    ``,
    `Return ONLY a JSON array of strings, no explanation. Example: ["comment 1", "comment 2"]`,
  ].filter(Boolean).join("\n");
}

export async function generateComments(params: GenerateParams): Promise<string[]> {
  if (!GROQ_API_KEY) throw new Error("VITE_GROQ_API_KEY is not set");

  const messages: { role: string; content: any }[] = [];

  if (params.input_type === "image" && params.image_base64) {
    // Use vision-capable model for images
    messages.push({
      role: "user",
      content: [
        { type: "text", text: buildPrompt(params) },
        { type: "image_url", image_url: { url: params.image_base64 } },
      ],
    });
  } else {
    messages.push({ role: "user", content: buildPrompt(params) });
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: params.input_type === "image" ? VISION_MODEL : MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.error?.message ?? res.statusText;
    if (res.status === 429) throw new Error("Rate limit hit, try again in a moment");
    throw new Error(msg || "Failed to generate comments");
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  // Parse JSON array from response
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Unexpected response format from AI");

  const comments: string[] = JSON.parse(match[0]);
  if (!comments.length) throw new Error("No comments generated");
  return comments;
}
