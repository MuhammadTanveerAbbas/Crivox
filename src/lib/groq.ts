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

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-comments`;
const REQUEST_TIMEOUT = 90_000; // 90 seconds (covers URL fetching + Groq API)

export async function generateComments(params: GenerateParams): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be logged in to generate comments.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        content: params.content,
        image_base64: params.image_base64,
        input_type: params.input_type || "text",
        tone: params.tone,
        length: params.length,
        platform: params.platform,
        language: params.language || "en",
        include_emoji: params.include_emoji || false,
        include_hashtags: params.include_hashtags || false,
        include_cta: params.include_cta || false,
        count: params.count || 3,
        single: params.single ? "true" : "false",
        variation_number: params.variation_number,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const errorMsg = (body as Record<string, unknown>)?.error as string;

      if (response.status === 429) {
        throw new Error(errorMsg || "Too many requests. Please wait a moment and try again.");
      }
      if (response.status === 401) {
        throw new Error(errorMsg || "Your session has expired. Please log in again.");
      }
      if (response.status === 402) {
        throw new Error(errorMsg || "Usage limit reached. Please add credits to continue.");
      }
      throw new Error(errorMsg || "Failed to generate comments. Please try again.");
    }

    const data = await response.json();
    if (!data.comments?.length) {
      throw new Error("No comments were generated. Please try again.");
    }
    return data.comments;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "The request timed out. This may happen with very long URLs or when the AI service is busy. "
        + "Please try again or use shorter content.",
      );
    }
    throw error;
  }
}
