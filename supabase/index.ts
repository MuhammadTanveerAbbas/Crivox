import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const languageNames: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  pt: "Portuguese", hi: "Hindi", ar: "Arabic", zh: "Chinese", ja: "Japanese",
};

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 20;
  const entry = requestCounts.get(userId);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  entry.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const platformGuides: Record<string, string> = {
      LinkedIn: `LinkedIn is a professional network.
Rules:
- Professional but conversational tone, NOT corporate jargon
- Reference industry trends, personal experience, or data points
- No clickbait, no emoji-overload, no hashtag-stuffing (max 3)
- Keep comments substantive — add value, don't just agree
- Be respectful and constructive, even when disagreeing
- Current norms (2024-2026): Short paragraphs, line breaks for readability, genuine storytelling over generic advice
- NEVER use: "Great post!", "Thanks for sharing", "This is so important", "Very insightful"
- DO: Add a specific observation, share a relevant experience, ask a thoughtful question`,

      "Twitter/X": `Twitter/X is a fast-paced public conversation platform.
Rules:
- Brevity is king — get to the point immediately
- Wit, humor, and hot takes perform well
- Threads are common for longer thoughts
- Reference current events, memes, or trending topics naturally
- No corporate-speak — be human, be raw, be real
- Emojis are fine but don't overdo it
- Hashtags: 1-2 max, only if genuinely relevant
- NEVER start with "I think" or "In my opinion" — state your take with confidence
- DO: Quote-motive, add a contrarian angle, or amplify with additional context`,

      Instagram: `Instagram is visual-first with community-driven comments.
Rules:
- Short, punchy, and emotionally resonant
- Engage with the post's vibe (aesthetic, funny, inspiring, etc.)
- Emojis are expected and welcome — use them naturally
- Questions drive replies and algorithmic engagement
- Be supportive and positive (toxic comments get buried)
- Stories replies should feel like DMs
- No hashtags in comments unless it's a branded campaign
- NEVER: "So true!", "Love this!", "Beautiful 😍" — be specific about what you love
- DO: Reference a specific element of the post, add personal resonance, ask a follow-up`,

      Facebook: `Facebook comments lean community and conversational.
Rules:
- Conversational and relatable — like talking to a neighbor
- Slightly longer-form than Instagram, more personal than LinkedIn
- Sharing personal anecdotes or local relevance is welcomed
- Emojis are natural and common
- Avoid politics/controversy unless the post invites it
- Reply to other commenters to build threads
- No hashtags in comments
- NEVER: Generic agreement without substance
- DO: Share a personal parallel, tag relevant friends, continue the conversation`,

      Reddit: `Reddit is topic-based communities with a strong anti-corporate culture.
Rules:
- Match the subreddit's tone (technical, humorous, supportive, critical)
- Authenticity is everything — Redditors can smell AI content instantly
- Be specific, cite sources if making claims, show expertise
- Self-deprecating humor and light sarcasm are often welcome
- No emojis on most subreddits (they get downvoted)
- No hashtags ever
- No marketing, no "great read", no "thanks for sharing"
- DO: Add technical detail, share a related experience, provide a counterpoint with evidence
- NEVER sound like a marketer, bot, or motivational speaker`,

      "Blog/Website": `Blog/Website comments are more substantive and thoughtful.
Rules:
- Longer-form, well-structured responses
- Engage with the article's thesis — agree, disagree, or build upon
- Show you read the full piece by referencing specific points
- Academic but accessible tone
- Cite related work or personal experience
- Questions that invite further discussion perform well
- No hashtags, limited emojis
- NEVER: "Great article!", "Well said", "This is so important", "Thanks for this"
- DO: Engage intellectually, provide additional resources, ask deeper questions`,

      Other: `Write naturally for the platform the user specified.
Rules:
- Match the expected tone and norms of the community
- Be authentic, specific, and add unique value
- Avoid generic statements that could apply to any post
- Adapt length to the platform's typical comment style`,
    };

    const platformRule = platformGuides[platform] || platformGuides.Other;

    const rules: string[] = [
      `Tone: ${tone}. Apply this tone naturally — don't announce it, embody it.`,
      `Length: Each comment should be ${lengthInstruction[length] || "3-4 sentences"}`,
      `Language: Write entirely in ${langName}. Use native idioms and natural phrasing.`,
      "Make each variation meaningfully different in structure, angle, and approach",
      "Be authentic and human-sounding — AI detection is easy when comments are too perfect",
      "Use specific, concrete language. Avoid vague statements like 'this is great' or 'love this'",
      "Vary sentence structure — don't start every sentence the same way",
      "Reference something specific from the post content to show you actually read it",
      "Avoid ALL of these AI slop phrases: 'great post', 'thanks for sharing', 'this is so important', 'very insightful', 'love this', 'couldn't agree more', 'spot on', 'well said', 'this resonates', 'thanks for this', 'great read', 'excellent points', 'powerful message', 'so well said', 'incredible insights'",
      "Sound like a real person with a unique voice — not a marketing team",
      "Do not use clichés, platitudes, or generic encouragement",
      "Do not over-explain or add unnecessary context — get to the point",
      "",
      `=== PLATFORM-SPECIFIC GUIDELINES FOR ${platform.toUpperCase()} ===`,
      platformRule,
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

    const systemPrompt = `You are an expert social media commenter with deep knowledge of every platform's culture, rules, and unwritten norms. You write comments that real people would write — specific, authentic, and valuable.

Generate exactly ${commentCount} distinct comment variation${commentCount > 1 ? "s" : ""} for a ${platform} post.

CRITICAL RULES:
${rules.filter(r => r).map((r) => `- ${r}`).join("\n")}

${include_emoji ? "\n- Use emojis naturally and sparingly — they should enhance meaning, not decorate emptiness." : "\n- Do NOT use any emojis."}
${include_hashtags ? "\n- Include 2-3 relevant hashtags at the end. Make them specific, not generic (#marketing not #love)." : "\n- Do NOT use hashtags."}
${include_cta ? "\n- End with a subtle, natural call-to-action — a question, an invitation to discuss, or a genuine curiosity prompt." : ""}
${single === "true" && variation_number ? `\n- This is a re-generation of variation #${variation_number}. Make it completely different from the original.` : ""}

Now read the post content below and write comments that:
1. Show you understand the specific post (reference details)
2. Add new thinking — don't just react, contribute
3. Feel like they were written by a real human in 2026
4. Would get upvotes/likes/replies from the platform's community
5. Make the original poster glad they posted

Return ONLY a valid JSON array of ${commentCount} strings. No markdown, no code blocks, no explanation outside the array.
Example: ["comment1"${commentCount > 1 ? ',"comment2","comment3"' : ""}]

IMPORTANT: If any of these phrases appear in your output, you have failed:
"Great post", "Thanks for sharing", "This is so important", "Very insightful", "Love this",
"Couldn't agree more", "Spot on", "Well said", "This resonates", "Great read",
"Excellent points", "Powerful message", "So well said", "Incredible insights",
"This is exactly what I needed", "Perfect timing", "Love this perspective"

Write like a human. Not a bot. Not a marketer. A human.`;

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
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
