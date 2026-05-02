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
  userId?: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

interface ProfileMemory {
  full_name: string | null;
  profession: string | null;
  industry: string | null;
  target_audience: string | null;
  use_case: string | null;
}

async function getUserMemory(userId: string): Promise<string> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, profession, industry, target_audience, use_case")
      .eq("id", userId)
      .maybeSingle();
    
    if (!profile) return "";
    
    const parts: string[] = [];
    if (profile.full_name) parts.push(`User's name: ${profile.full_name}`);
    if (profile.profession) parts.push(`Their profession: ${profile.profession}`);
    if (profile.industry) parts.push(`Their industry: ${profile.industry}`);
    if (profile.target_audience) parts.push(`They engage with: ${profile.target_audience}`);
    if (profile.use_case) parts.push(`Their goal: ${profile.use_case}`);
    
    if (parts.length === 0) return "";
    return `\n\nUser Context:\n${parts.join("\n")}`;
  } catch {
    return "";
  }
}

const toneInstructions: Record<string, string> = {
  professional: `
    Write in a polished, formal tone. Use precise vocabulary.
    Add value with a clear insight or relevant observation.
    Sound like a senior expert commenting in their field.
    Avoid casual phrases, slang, or filler words.
    Start with substance — never with "Great post!" or similar openers.
  `,
  casual: `
    Write like a real human talking to a friend.
    Use natural, conversational language. Contractions are fine.
    Be genuine and warm without being overly enthusiastic.
    Add a personal touch — a quick reaction, a relatable angle.
    Never sound corporate or robotic.
  `,
  witty: `
    Be clever and light. Use wordplay, irony, or a surprising angle when it naturally fits.
    One well-placed wit beats forced humor every time.
    Do not use exclamation marks excessively.
    The comment should make someone smile or think — not cringe.
    Avoid puns that feel forced.
  `,
  supportive: `
    Be warm, encouraging, and genuine.
    Acknowledge the effort or value in what was shared.
    Add something constructive — a related thought, a word of encouragement, or a validation.
    Never be empty or hollow like "This is amazing!" — back it up.
    Sound like a trusted peer, not a fan.
  `,
  bold: `
    Take a strong, confident stance. Be direct and assertive.
    Challenge assumptions if relevant. Offer a powerful take or counterpoint.
    Do not hedge. Do not qualify every sentence.
    Sound like someone who has conviction and isn't afraid to voice it.
    One bold, clear statement is worth more than three soft ones.
  `,
  educational: `
    Add genuine informational value. Teach something relevant.
    Share a fact, a framework, a stat, or a clarification that adds depth.
    Write like someone who knows this topic well and wants others to learn.
    Be clear and accessible — no jargon without explanation.
    End with something the reader can apply or remember.
  `,
  insightful: `
    Offer a sharp, nuanced perspective that goes beyond the surface.
    Connect dots the original post didn't. Add a layer of depth.
    Think: what would a thoughtful expert who has seen patterns add here?
    Avoid the obvious. Avoid restating what was already said.
    Make the reader feel they gained something from reading your comment.
  `,
  authoritative: `
    Write with command and credibility. Use confident, declarative sentences.
    Sound like someone who has real experience in this space.
    Reference relevant context or implications without being preachy.
    Be concise — authority doesn't need filler words.
    Every sentence should earn its place.
  `,
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .trim();
}

function buildPrompt(params: GenerateParams, userMemory: string = ""): string {
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

  const exactCount = single ? 1 : count;
  const toneKey = tone.toLowerCase();
  const toneInstruction = toneInstructions[toneKey] || toneInstructions[toneKey.replace(" ", "")] || "";

  return [
    `You are an expert social media comment writer.`,
    `Generate EXACTLY ${exactCount} comment(s). No more, no fewer.`,
    `Return ONLY a JSON array with exactly ${exactCount} string element(s).`,
    `Example for count=1: ["Your comment here"]`,
    `Example for count=2: ["First comment", "Second comment"]`,
    `IMPORTANT: Return plain text only. Do not use any markdown formatting including **, *, _, #, or backticks.`,
    `Do not return any explanation, preamble, or extra text outside the JSON array.`,
    toneInstruction ? `Tone Instructions:\n${toneInstruction}` : "",
    userMemory ? `Use the following context about the user to personalize the comment style and relevance:${userMemory}` : "",
    ``,
    `Generate ${single ? "1" : count} unique, engaging ${tone.toLowerCase()} comment${single ? "" : "s"} for ${inputDesc}.`,
    `Platform: ${platform}. Length: ${lengthGuide}. Language: ${language}.`,
    extras && `Requirements: ${extras}.`,
    variationNote,
  ].filter(Boolean).join("\n");
}

export async function generateComments(params: GenerateParams): Promise<string[]> {
  if (!GROQ_API_KEY) throw new Error("VITE_GROQ_API_KEY is not set");

  const userMemory = params.userId ? await getUserMemory(params.userId) : "";

  const messages: { role: string; content: any }[] = [];

  if (params.input_type === "image" && params.image_base64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: buildPrompt(params, userMemory) },
        { type: "image_url", image_url: { url: params.image_base64 } },
      ],
    });
  } else {
    messages.push({ role: "user", content: buildPrompt(params, userMemory) });
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
  
  const exactCount = params.single ? 1 : (params.count ?? 3);
  const enforced = comments.slice(0, exactCount);
  const stripped = enforced.map(stripMarkdown);
  
  return stripped;
}
