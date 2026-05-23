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

export async function generateComments(params: GenerateParams): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be logged in to generate comments");
  }

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
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error("Rate limit hit, try again in a moment");
    if (response.status === 401) throw new Error("Session expired. Please log in again.");
    throw new Error(((err as Record<string, unknown>)?.error as string) || "Failed to generate comments");
  }

  const data = await response.json();
  if (!data.comments?.length) throw new Error("No comments generated");
  return data.comments;
}
