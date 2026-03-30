import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  pt: "Portuguese", hi: "Hindi", ar: "Arabic", zh: "Chinese", ja: "Japanese",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

    const {
      content, image_base64, tone, length, platform, input_type,
      language = "en",
      include_emoji = false,
      include_hashtags = false,
      include_cta = false,
      count = 3,
      single,
      variation_number,
    } = await req.json();

    const commentCount = single === "true" ? 1 : Math.min(Math.max(Number(count) || 3, 1), 5);

    let postContent = content || "";

    if (input_type === "image" && image_base64) {
      const extractResp = await fetch(GROQ_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Extract all the text content from this screenshot of a social media post. Return only the post content, nothing else." },
                { type: "image_url", image_url: { url: image_base64 } },
              ],
            },
          ],
        }),
      });

      if (!extractResp.ok) {
        const err = await extractResp.text();
        console.error("Image extraction error:", err);
        throw new Error("Failed to extract text from image");
      }

      const extractData = await extractResp.json();
      postContent = extractData.choices?.[0]?.message?.content || "";
    }

    if (input_type === "url" && content) {
      postContent = `[URL: ${content}] - Generate comments as if this is a ${platform} post. The user shared this link.`;
    }

    if (!postContent) {
      throw new Error("No content to generate comments for");
    }

    const lengthInstruction: Record<string, string> = {
      Short: "1-2 sentences",
      Medium: "3-4 sentences",
      Long: "a full paragraph (5-7 sentences)",
      "AI Decides": "whatever length feels natural",
    };

    const langName = languageNames[language] || "English";

    const rules: string[] = [
      `Tone: ${tone}`,
      `Length: Each comment should be ${lengthInstruction[length] || "3-4 sentences"}`,
      `Language: Write entirely in ${langName}`,
      "Make each variation meaningfully different in approach",
      "Be authentic and human-sounding, not robotic",
      "Match the platform's style and norms",
      "Do NOT start with 'Great post!' or similar generic openers",
    ];

    if (include_emoji) {
      rules.push("Include relevant emojis naturally throughout the comment");
    } else {
      rules.push("Do NOT use any emojis");
    }

    if (include_hashtags) {
      rules.push("Include 2-3 relevant hashtags at the end of each comment");
    } else {
      rules.push("Do NOT use hashtags unless specifically appropriate for the platform");
    }

    if (include_cta) {
      rules.push("End each comment with a subtle call-to-action (e.g. a question, invitation to discuss, or encouragement to connect)");
    }

    if (single === "true" && variation_number) {
      rules.push(`This is a regeneration of variation #${variation_number}. Make it completely different from a typical response.`);
    }

    const systemPrompt = `You are an expert social media commenter. Generate exactly ${commentCount} distinct comment variation${commentCount > 1 ? "s" : ""} for a ${platform} post.

Rules:
${rules.map((r) => `- ${r}`).join("\n")}

Return ONLY a JSON array of ${commentCount} strings. No markdown, no explanation. Example: ["comment1"${commentCount > 1 ? ',"comment2","comment3"' : ""}]`;

    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the post content to comment on:\n\n${postContent}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "[]";

    let comments: string[];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      comments = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      comments = raw.split(/\n\n+/).filter((s: string) => s.trim()).slice(0, commentCount);
    }

    if (!comments.length) {
      throw new Error("No comments generated");
    }

    return new Response(JSON.stringify({ comments: comments.slice(0, commentCount) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-comments error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});