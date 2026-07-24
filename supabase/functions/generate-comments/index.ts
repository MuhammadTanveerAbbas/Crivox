import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Model Configuration ────────────────────────────────────────────────────
// All models are configurable via env vars so you NEVER need to change code.
//
//   GROQ_MODEL              = primary text generation model (default: llama-3.3-70b-versatile)
//   GROQ_FALLBACK_MODELS    = comma-separated fallbacks if primary is removed (default below)
//   GROQ_VISION_MODEL       = primary vision/OCR model (default: meta-llama/llama-4-scout-17b-16e-instruct)
//   GROQ_VISION_FALLBACKS   = comma-separated fallbacks for vision (default below)
//
// If a model returns 404/model_not_found, the next fallback is tried automatically.
// If ALL models fail, a clear error lists which models were tried.

interface ModelConfig {
  primary: string;
  fallbacks: string[];
}

function getModelConfig(
  envKey: string,
  fallbackEnvKey: string,
  defaultPrimary: string,
  defaultFallbacks: string[],
): ModelConfig {
  const primary = Deno.env.get(envKey) || defaultPrimary;
  const fallbackStr = Deno.env.get(fallbackEnvKey) || "";
  const fallbacks = fallbackStr
    ? fallbackStr.split(",").map((s) => s.trim()).filter(Boolean)
    : defaultFallbacks;
  return { primary, fallbacks };
}

function getAllModels(config: ModelConfig): string[] {
  return [config.primary, ...config.fallbacks];
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isModelNotFound(bodyText: string, status: number): boolean {
  if (status === 404) return true;
  const parsed = tryParseJson(bodyText);
  if (!parsed) return false;
  const err = parsed.error as Record<string, unknown> | undefined;
  if (!err) return false;
  return (
    err.code === "model_not_found" ||
    String(err.message ?? "").includes("model_not_found") ||
    String(err.code ?? "").includes("not_found")
  );
}

async function callGroqWithFallback(
  baseUrl: string,
  apiKey: string,
  config: ModelConfig,
  bodyFn: (model: string) => Record<string, unknown>,
  signal: AbortSignal,
  label: string,
): Promise<{ data: Record<string, unknown>; model: string }> {
  const models = getAllModels(config);
  const errors: { model: string; reason: string }[] = [];

  for (const model of models) {
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyFn(model)),
        signal,
      });

      if (response.ok) {
        const data = await response.json() as Record<string, unknown>;
        return { data, model };
      }

      const bodyText = await response.text().catch(() => "");

      if (response.status === 429) {
        const err = new Error("AI service is busy. Please wait a moment and try again.");
        (err as any).statusCode = 429;
        throw err;
      }

      if (isModelNotFound(bodyText, response.status)) {
        errors.push({ model, reason: "model not available (removed/deprecated)" });
        continue;
      }

      throw new Error(
        `${label} failed (${response.status}): ${bodyText.slice(0, 300)}`,
      );
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (err.statusCode === 429) throw err;
      if (err instanceof TypeError && String(err.message ?? "").includes("fetch")) {
        errors.push({ model, reason: "network error" });
        continue;
      }
      throw err;
    }
  }

  const detail = errors
    .map((e, i) => `  ${i + 1}. "${e.model}" — ${e.reason}`)
    .join("\n");

  throw new Error(
    `All AI models failed for ${label}.\nTried:\n${detail}\n\n`
    + "Please try again later or contact support if this persists.",
  );
}

const languageNames: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  pt: "Portuguese", hi: "Hindi", ar: "Arabic", zh: "Chinese", ja: "Japanese",
};

const lengthInstruction: Record<string, string> = {
  Short: "1-2 sentences (brief and punchy)",
  Medium: "3-4 sentences (balanced and natural)",
  Long: "a full paragraph (5-7 sentences with depth)",
  "AI Decides": "whatever length feels most natural for the platform and content",
};

const toneGuides: Record<string, string> = {
  Professional:
    "Sound like a thoughtful industry expert.\n"
    + "- Use precise terminology and reference relevant trends or data\n"
    + "- Keep sentences well-structured with clear reasoning\n"
    + "- Avoid slang, excessive emojis, or overly casual language\n"
    + "- Project quiet confidence — state ideas as observations, not commands",

  Casual:
    "Write like you're chatting with a colleague over coffee.\n"
    + "- Use contractions, natural phrasing, and a relaxed rhythm\n"
    + "- Be approachable and relatable — avoid jargon or buzzwords\n"
    + "- It's okay to be a little informal, but stay on-topic\n"
    + "- Let your personality show without oversharing",

  Witty:
    "Be clever, not mean. Punch up, not down.\n"
    + "- Use wordplay, unexpected angles, or dry humor\n"
    + "- Timing and brevity are everything — a short punchy line beats a long setup\n"
    + "- Read the room: wit works best when it's self-aware or observational\n"
    + "- Never use sarcasm that could be mistaken for hostility",

  Supportive:
    "Warm, genuine encouragement.\n"
    + "- Validate the poster's effort or perspective before adding your own take\n"
    + "- Be specific about what you appreciate — generic praise rings hollow\n"
    + "- Offer reassurance or motivation without being syrupy\n"
    + "- Use a kind, empathetic tone that makes the poster glad they shared",

  Bold:
    "Take a strong, confident stance.\n"
    + "- State your position clearly and without hedging\n"
    + "- Challenge assumptions respectfully — bold doesn't mean aggressive\n"
    + "- Back your take with reasoning, not just volume\n"
    + "- Be willing to go against the grain, but stay constructive",

  Educational:
    "Teach something relevant to the post.\n"
    + "- Break down complex ideas into digestible pieces\n"
    + "- Use concrete examples, analogies, or quick step-by-step logic\n"
    + "- Cite frameworks, studies, or mental models naturally\n"
    + "- Prioritize clarity over showing off — the goal is understanding",

  Insightful:
    "Add a layer the post didn't explicitly state.\n"
    + "- Connect dots between different ideas or trends\n"
    + "- Reframe the topic in a fresh light or reveal a hidden implication\n"
    + "- Show deep understanding through nuance, not jargon\n"
    + "- Offer perspective that makes the reader think 'I hadn't considered that'",

  Authoritative:
    "Speak with subject-matter expertise.\n"
    + "- Use domain-specific knowledge and precise terminology\n"
    + "- Reference experience or credentials implicitly — show, don't tell\n"
    + "- Be definitive without being arrogant: 'here's what I've learned' over 'trust me'\n"
    + "- Back claims with substance, not bluster",
};

const platformGuides: Record<string, string> = {
  LinkedIn:
    "LinkedIn is a professional network. Comments should add career-relevant value.\n"
    + "RULES:\n"
    + "- Professional but conversational — NOT corporate jargon or buzzwords\n"
    + "- Reference industry trends, personal experience, or data points\n"
    + "- No clickbait, no emoji-overload, max 3 hashtags if used\n"
    + "- Short paragraphs with line breaks for readability\n"
    + "- Be respectful and constructive even when disagreeing\n"
    + "- BANNED: 'Great post!', 'Thanks for sharing', 'This is so important',\n"
    + "  'Very insightful', 'Well said', 'Great insights', 'Love this'\n"
    + "- DO: Add a specific observation, share a relevant experience, ask a thoughtful question\n"
    + "- ALGO TIP: Comments that prompt a reply from the original poster get weighted higher by the 2026 LinkedIn algorithm. Include a real question or invite a genuine discussion, not a rhetorical one. Specific, substantive comments (10+ words) carry more weight than likes.",

  "Twitter/X":
    "Twitter/X is fast-paced and public. Brevity and personality win.\n"
    + "RULES:\n"
    + "- Get to the point immediately — no warm-up sentences\n"
    + "- Wit, hot takes, and sharp observations perform best\n"
    + "- Thread-style (numbered points) is fine for longer thoughts\n"
    + "- Reference current events, memes, or trends naturally\n"
    + "- No corporate-speak — be raw, be real, be human\n"
    + "- Max 2 hashtags, only if genuinely relevant\n"
    + "- BANNED: 'I think', 'In my opinion', 'Great thread', 'This',\n"
    + "  'Couldn't agree more', 'Facts', 'This is the way'\n"
    + "- DO: Quote-motive, add a contrarian angle, or amplify with context",

  Instagram:
    "Instagram is visual-first with tight-knit comment communities.\n"
    + "RULES:\n"
    + "- Short, punchy, emotionally resonant comments\n"
    + "- Match the post's vibe (aesthetic, funny, inspiring, educational)\n"
    + "- Emojis are expected — use them naturally to convey tone\n"
    + "- Questions drive replies and algorithmic engagement\n"
    + "- Be supportive and positive\n"
    + "- No hashtags in comments\n"
    + "- BANNED: 'So true!', 'Love this!', 'Beautiful ', 'This is everything',\n"
    + "  'Perfect', ' obsessed', 'Need this'\n"
    + "- DO: Reference a specific element of the post, add personal resonance, ask a follow-up",

  Facebook:
    "Facebook comments are community conversations.\n"
    + "RULES:\n"
    + "- Conversational and relatable — like talking to a neighbor\n"
    + "- Slightly longer than Instagram, more personal than LinkedIn\n"
    + "- Sharing personal anecdotes or local relevance is welcomed\n"
    + "- Emojis are natural and common\n"
    + "- Avoid politics or controversy unless the post invites it\n"
    + "- No hashtags in comments\n"
    + "- BANNED: Generic agreement without substance, 'Love this', 'So true',\n"
    + "  'Thanks for sharing', 'This is great'\n"
    + "- DO: Share a personal parallel, tag relevant friends, continue the conversation",

  Reddit:
    "Reddit is topic-based communities with strong anti-corporate culture.\n"
    + "RULES:\n"
    + "- Match the subreddit's tone (technical, humorous, supportive, critical)\n"
    + "- Authenticity is everything — Redditors detect AI content instantly\n"
    + "- Be specific, cite sources if making claims, show expertise\n"
    + "- Self-deprecating humor and light sarcasm are often welcome\n"
    + "- No emojis on most subreddits (they get downvoted)\n"
    + "- No hashtags ever\n"
    + "- BANNED: 'Great post', 'Thanks for sharing', 'This', 'Came here to say this',\n"
    + "  'This is the way', 'Underrated comment', marketing language, motivational phrases\n"
    + "- DO: Add technical detail, share a related experience, provide a counterpoint with evidence",

  "Blog/Website":
    "Blog/Website comments are substantive discussions.\n"
    + "RULES:\n"
    + "- Longer-form, well-structured responses with real substance\n"
    + "- Engage with the article's thesis — agree, disagree, or build upon it\n"
    + "- Reference specific points from the piece to show you read it\n"
    + "- Academic-but-accessible tone; avoid oversimplification\n"
    + "- Cite related work, studies, or personal experience\n"
    + "- Questions that invite further discussion perform well\n"
    + "- BANNED: 'Great article!', 'Well said', 'This is so important',\n"
    + "  'Thanks for this', 'Excellent piece', 'Great read'\n"
    + "- DO: Engage intellectually, provide additional resources, ask deeper questions",

  "Hacker News":
    "Hacker News is a technical community that values substance over style.\n"
    + "RULES:\n"
    + "- Zero marketing tone. No self-promotion, no buzzwords, no landing page language\n"
    + "- Technical precision matters: be accurate, specific, and cite details\n"
    + "- Willingness to be contrarian is respected, but back it with reasoning\n"
    + "- Short and dense over long and padded. Every sentence should carry weight\n"
    + "- No emojis, no hashtags, no markdown formatting beyond basic emphasis\n"
    + "- Reference the post content directly before adding your own take\n"
    + "- BANNED: 'Great post', 'Thanks for sharing', 'Interesting', 'Love this',\n"
    + "  'This is important', 'Bookmarking', marketing language, self-promotion\n"
    + "- DO: Add technical detail, correct a specific claim, share a relevant implementation experience",

  "Indie Hackers":
    "Indie Hackers is a community of bootstrapped founders and builders.\n"
    + "RULES:\n"
    + "- Builder-to-builder voice: comfortable referencing metrics, revenue, user numbers\n"
    + "- Supportive but specific, generic encouragement rings hollow\n"
    + "- 'What did you actually learn' energy over generic 'keep going' messages\n"
    + "- Share real numbers and real experiences when relevant\n"
    + "- Emojis are fine in moderation, hashtags are not\n"
    + "- No corporate jargon, no investor-speak\n"
    + "- BANNED: 'Great idea', 'Love this', 'Thanks for sharing', 'This is inspiring',\n"
    + "  'You got this', 'Keep grinding', marketing language\n"
    + "- DO: Ask about specific metrics, share a parallel experience, offer actionable feedback",

  GitHub:
    "GitHub is for discussing code, issues, PRs, and technical decisions.\n"
    + "RULES:\n"
    + "- Technical, specific, directly references actual code or behavior\n"
    + "- No fluff, no greeting, get straight to the technical point\n"
    + "- Be constructive: suggest improvements, not just problems\n"
    + "- Reference specific lines, functions, or behaviors when commenting on code\n"
    + "- No emojis, no hashtags, no marketing language\n"
    + "- Professional and respectful even when disagreeing about approach\n"
    + "- BANNED: 'Great code', 'Nice work', 'Love this', 'Thanks for sharing',\n"
    + "  'This is awesome', any non-technical praise\n"
    + "- DO: Reference specific code patterns, suggest concrete improvements, cite alternatives",

  Threads:
    "Threads is Meta's public conversation platform, similar to X but slightly warmer.\n"
    + "RULES:\n"
    + "- Short and punchy. Get to the point in the first sentence\n"
    + "- Slightly warmer and more conversational than X/Twitter\n"
    + "- Wit and personality are welcome, but keep it accessible\n"
    + "- Emojis are expected and natural, use 1-2 per comment\n"
    + "- No hashtags (they are not standard on Threads yet)\n"
    + "- Thread-style replies are fine for longer thoughts\n"
    + "- BANNED: 'Great thread', 'Love this', 'This', 'Facts',\n"
    + "  'Couldn't agree more', corporate-speak, overly formal language\n"
    + "- DO: Add a personal take, reference current culture, respond to the poster's specific point",

  Other:
    "Write naturally for the platform the user specified.\n"
    + "RULES:\n"
    + "- Match the expected tone and norms of the community\n"
    + "- Be authentic, specific, and add unique value\n"
    + "- Avoid generic statements that could apply to any post\n"
    + "- Adapt length and style to the platform's typical comment culture",
};

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowMs = 60_000;
  const maxRequests = 20;
  const now = new Date();

  const { data: row } = await supabase
    .from("rate_limits")
    .select("window_start, count")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    await supabase.from("rate_limits").insert({
      user_id: userId,
      window_start: now.toISOString(),
      count: 1,
    });
    return { allowed: true };
  }

  const windowStart = new Date(row.window_start).getTime();
  if (now.getTime() - windowStart > windowMs) {
    await supabase.from("rate_limits").update({
      window_start: now.toISOString(),
      count: 1,
    }).eq("user_id", userId);
    return { allowed: true };
  }

  if (row.count >= maxRequests) {
    const retryAfter = Math.ceil((windowStart + windowMs - now.getTime()) / 1000);
    return { allowed: false, retryAfter };
  }

  await supabase.from("rate_limits").update({
    count: row.count + 1,
  }).eq("user_id", userId);

  return { allowed: true };
}

// ── URL Fetching ──────────────────────────────────────────────────────────

async function fetchUrlContent(
  rawUrl: string,
): Promise<{ title: string; description: string; content: string; url: string }> {
  let url: URL;
  try {
    const normalized = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    url = new URL(normalized);
  } catch {
    throw new Error(
      "The URL you entered is not valid. Please check the link and try again.\n\n"
      + "Tip: Try pasting the post content manually using the Text tab instead.",
    );
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Crivox/1.0; SocialMediaCommentGenerator; +https://crivox.app)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "This website blocked the request. Some sites don't allow automated access.\n\n"
            + "Try pasting the post content manually using the Text tab.",
          );
        }
        if (response.status === 404) {
          throw new Error(
            "Page not found (404 error). The link may be broken or the page was removed.\n\n"
            + "Please check the URL and try again.",
          );
        }
        if (response.status === 429) {
          throw new Error(
            "The website is rate-limiting requests. Please wait a moment and try again.",
          );
        }
        throw new Error(
          `The server responded with status ${response.status} when trying to fetch the URL.`,
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        const text = await response.text();
        return {
          title: url.toString(),
          description: `Content type: ${contentType}`,
          content: `[This URL points to ${contentType || "non-HTML content"}]\n\n${text.slice(0, 3000)}`,
          url: url.toString(),
        };
      }

      const html = await response.text();
      if (html.length > 500_000) {
        throw new Error(
          "The page is too large to process. Try pasting the content manually using the Text tab.",
        );
      }

      const extracted = extractHtmlContent(html, url.toString());

      if (!extracted.content && !extracted.title) {
        throw new Error(
          "Could not extract meaningful content from this page. The page may require JavaScript to render.\n\n"
          + "Try pasting the content manually using the Text tab.",
        );
      }

      return extracted;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TypeError && (error.message.includes("fetch") || error.message.includes("network"))) {
        if (attempt < 2) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        throw new Error(
          "Could not connect to the website. Please check that the URL is correct and try again.",
        );
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        if (attempt < 2) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw new Error(
          "The website took too long to respond. Try pasting the content manually using the Text tab.",
        );
      }
      throw error;
    }
  }

  throw new Error("Could not fetch the URL content after multiple attempts.");
}

// ── GitHub Repo Fetching ─────────────────────────────────────

async function fetchGitHubContent(
  repoUrl: string,
): Promise<{ title: string; description: string; content: string; url: string }> {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
  if (!match) {
    throw new Error("Could not parse GitHub URL. Use format: github.com/owner/repo");
  }
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const repoResponse = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "Crivox/1.0" },
  });

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) throw new Error("GitHub repository not found. Check the owner and repo name.");
    if (repoResponse.status === 403) throw new Error("GitHub API rate limit reached. Try again later.");
    throw new Error(`GitHub API returned status ${repoResponse.status}`);
  }

  const repoData = await repoResponse.json();
  const description = repoData.description || "";
  const language = repoData.language || "";
  const stars = repoData.stargazers_count ?? 0;
  const topics = (repoData.topics || []).join(", ");

  // Fetch README
  let readmeContent = "";
  try {
    const readmeResponse = await fetch(`${apiUrl}/readme`, {
      headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "Crivox/1.0" },
    });
    if (readmeResponse.ok) {
      readmeContent = await readmeResponse.text();
      if (readmeContent.length > 4000) {
        readmeContent = readmeContent.slice(0, 4000) + "\n\n[... README truncated]";
      }
    }
  } catch {
    // README fetch is non-critical
  }

  const title = `${owner}/${repo}`;
  const content = (
    `Repository: ${owner}/${repo}\n`
    + (description ? `Description: ${description}\n` : "")
    + (language ? `Language: ${language}\n` : "")
    + `Stars: ${stars}\n`
    + (topics ? `Topics: ${topics}\n` : "")
    + (readmeContent ? `\n--- README ---\n${readmeContent}` : "")
  );

  return { title, description, content, url: repoUrl };
}

// ── npm Package Fetching ──────────────────────────────────────

async function fetchNpmContent(
  packageName: string,
): Promise<{ title: string; description: string; content: string; url: string }> {
  const name = packageName.replace(/^https?:\/\/www\.npmjs\.com\/package\//, "").replace(/\/$/, "").trim();
  if (!name) throw new Error("Could not parse npm package name.");

  const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}`;

  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error(`npm package "${name}" not found.`);
    throw new Error(`npm registry returned status ${response.status}`);
  }

  const data = await response.json();

  const latestVersion = data["dist-tags"]?.latest || "unknown";
  const versionData = data.versions?.[latestVersion] || {};
  const description = data.description || versionData.description || "";
  const keywords = (data.keywords || []).join(", ");
  const license = data.license || versionData.license || "unknown";

  // Fetch README
  let readmeContent = "";
  try {
    const readmeResponse = await fetch(`${apiUrl}/${latestVersion}/readme`, {
      headers: { Accept: "text/html" },
    });
    if (readmeResponse.ok) {
      readmeContent = await readmeResponse.text();
      if (readmeContent.length > 4000) {
        readmeContent = readmeContent.slice(0, 4000) + "\n\n[... README truncated]";
      }
    }
  } catch {
    // README fetch is non-critical
  }

  const title = name;
  const content = (
    `Package: ${name}\n`
    + `Version: ${latestVersion}\n`
    + (description ? `Description: ${description}\n` : "")
    + (keywords ? `Keywords: ${keywords}\n` : "")
    + `License: ${license}\n`
    + (readmeContent ? `\n--- README ---\n${readmeContent}` : "")
  );

  return { title, description, content, url: `https://www.npmjs.com/package/${name}` };
}

function extractHtmlContent(
  html: string,
  url: string,
): { title: string; description: string; content: string; url: string } {
  const title = extractTag(html, "title");
  const description =
    extractMeta(html, "name", "description")
    || extractMeta(html, "property", "og:description")
    || extractMeta(html, "name", "twitter:description")
    || "";
  const ogTitle =
    extractMeta(html, "property", "og:title")
    || extractMeta(html, "name", "twitter:title")
    || "";

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<\/(p|div|section|article|blockquote|h[1-6]|li|ul|ol|table|tr)>/gi, "\n")
    .replace(/<(p|div|section|article|blockquote|h[1-6]|li|br|hr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  const content = lines.slice(0, 80).join("\n\n").slice(0, 8000);

  return {
    title: ogTitle || title,
    description,
    content,
    url,
  };
}

function extractTag(html: string, tag: string): string {
  const match = html.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  if (!match) return "";
  return match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractMeta(html: string, attr: string, value: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${value}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function formatUrlContent(
  extracted: { title: string; description: string; content: string; url: string },
  platform: string,
): string {
  const parts: string[] = [];

  if (extracted.title) parts.push(`Title: ${extracted.title}`);
  if (extracted.description) parts.push(`Description: ${extracted.description}`);
  parts.push(`URL: ${extracted.url}`);

  if (extracted.content) {
    parts.push("");
    parts.push("--- Page Content ---");
    parts.push(extracted.content);
  }

  parts.push("");
  parts.push(
    `(This content was fetched from the URL above. Generate comments as if replying to this ${platform} post.)`,
  );

  return parts.join("\n");
}

// ── Image Extraction ──────────────────────────────────────────────────────

async function extractImageText(
  imageBase64: string,
  groqApiKey: string,
  groqBaseUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const visionConfig = getModelConfig(
    "GROQ_VISION_MODEL",
    "GROQ_VISION_FALLBACKS",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    ["meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b"],
  );

  const { data } = await callGroqWithFallback(
    groqBaseUrl,
    groqApiKey,
    visionConfig,
    (model) => ({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract all the text content from this screenshot of a social media post. "
                + "Return only the post content exactly as written — nothing else, no commentary.",
            },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
    }),
    signal,
    "Image OCR",
  );

  const text = (data.choices as any)?.[0]?.message?.content || "";
  if (!text) throw new Error("Could not extract text from the image. Try a clearer screenshot.");
  return text;
}

// ── System Prompt Builder ─────────────────────────────────────────────────

const bannedPhrases = [
  "Great post", "Thanks for sharing", "This is so important", "Very insightful",
  "Love this", "Couldn't agree more", "Spot on", "Well said", "This resonates",
  "Great read", "Excellent points", "Powerful message", "So well said",
  "Incredible insights", "This is exactly what I needed", "Perfect timing",
  "Love this perspective", "Great insights", "This is everything",
  "Came here to say this", "This is the way", "Underrated comment",
  "Facts", "This", " literally", " obsessed", "Need this",
  "Great article", "Nice post", "Awesome", "Perfect",
  "game changer", "unlock", "in today's fast paced world",
  "delve", "showcase", "navigate the landscape", "at the end of the day",
  "revolutionize", "leverage", "seamless", "transformative", "empower",
  "bespoke", "holistic",
];

function buildCommenterBlock(profile: {
  full_name?: string; profession?: string; industry?: string;
  target_audience?: string; use_case?: string;
}, voiceSamples: string[]): string | null {
  const parts: string[] = [];
  if (profile.full_name) parts.push(`Name: ${profile.full_name}`);
  if (profile.profession) parts.push(`Role: ${profile.profession}`);
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.target_audience) parts.push(`Audience: ${profile.target_audience}`);
  if (profile.use_case) parts.push(`Goal: ${profile.use_case}`);
  if (parts.length === 0 && voiceSamples.length === 0) return null;

  const profileBlock = parts.length > 0
    ? `ABOUT THE COMMENTER:\n${parts.join("\n")}\n\nThe commenter above is the person whose voice you should match. Write comments that fit their professional identity, audience, and context. This is who they are, write as them.`
    : "";

  const voiceBlock = voiceSamples.length > 0
    ? `\n\nVOICE REFERENCE:\nHere is how this person actually writes. Match their rhythm, vocabulary, and sentence patterns. Do not copy the content, imitate the voice.\n${voiceSamples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join("\n\n")}`
    : "";

  return profileBlock + voiceBlock || null;
}

function buildRules(options: {
  tone: string; length: string; language: string; platform: string;
  includeEmoji: boolean; includeHashtags: boolean; includeCta: boolean;
  single: boolean; variationNumber: number | null;
}): string[] {
  const rules: string[] = [
    `TONE: ${options.tone}`,
    ...(toneGuides[options.tone] || "").split("\n").filter(Boolean).map((l) => `  ${l}`),
    "",
    `LENGTH: Each comment should be ${lengthInstruction[options.length] || "3-4 sentences"}`,
    "",
    `LANGUAGE: Write entirely in ${languageNames[options.language] || "English"}. Use native idioms and natural phrasing.`,
    "",
    "QUALITY RULES:",
    "  - Each variation must be meaningfully different in structure, angle, and approach",
    "  - Reference something specific from the post content to prove you read it",
    "  - Use concrete, specific language — avoid vague praise",
    "  - Never announce the tone ('Here's my professional take...') — just write in that tone",
    "  - No clichés, platitudes, or generic encouragement",
    "  - Get to the point — no filler introductions",
    "",
    "HUMANIZATION RULES (these matter more than any other rule):",
    "  - Vary sentence length aggressively. Mix 3-8 word sentences with 20+ word sentences in the same comment. AI output defaults to a narrow medium band, avoid that.",
    "  - Never use three-item lists (triads like 'fast, reliable, and scalable' are an AI tell). One or two specifics beat a rhythmic three.",
    "  - Never use the 'it's not X, it's Y' construction or similar smooth-transition scaffolding.",
    "  - No hedging. If the comment would naturally take a position, take it clearly.",
    "  - Never start consecutive sentences with the same word or structure.",
    "  - Zero em dashes (---) or hyphens used as sentence separators. Use periods, commas, or colons instead.",
    "",
    "ABSOLUTELY BANNED PHRASES (never use these):",
    `  ${bannedPhrases.join(", ")}`,
    "",
  ];

  if (options.includeEmoji) {
    rules.push("EMOJIS: Use emojis naturally to enhance meaning — don't decorate emptiness.");
  } else {
    rules.push("EMOJIS: Do NOT use any emojis under any circumstances.");
  }

  if (options.includeHashtags) {
    rules.push("HASHTAGS: Include 2-3 relevant hashtags at the end. Make them specific (#DataScience not #love).");
  } else {
    rules.push("HASHTAGS: Do NOT use hashtags unless the platform guide explicitly says otherwise.");
  }

  if (options.includeCta) {
    rules.push("CTA: End each comment with a subtle call-to-action — a question, an invitation to discuss, or a genuine curiosity prompt.");
  }

  if (options.single && options.variationNumber) {
    rules.push(
      `REGENERATION: This replaces variation #${options.variationNumber}. Make it completely different — new angle, new structure, new opening.`,
    );
  }

  return rules;
}

function buildSystemPrompt(options: {
  tone: string; length: string; platform: string; language: string;
  includeEmoji: boolean; includeHashtags: boolean; includeCta: boolean;
  commentCount: number; single: boolean; variationNumber: number | null;
  profile?: { full_name?: string; profession?: string; industry?: string;
    target_audience?: string; use_case?: string };
  voiceSamples?: string[];
}): string {
  const rules = buildRules(options);
  const platformRule = platformGuides[options.platform] || platformGuides.Other;
  const commenterBlock = buildCommenterBlock(options.profile || {}, options.voiceSamples || []);
  const commenterSection = commenterBlock ? `\n${commenterBlock}\n` : "";

  return `You are an expert social media comment writer. You deeply understand every platform's culture, norms, and unwritten rules. You write comments that real people would write — specific, authentic, and valuable.${commenterSection}

Generate exactly ${options.commentCount} distinct comment variation${options.commentCount > 1 ? "s" : ""} for a ${options.platform} post.

CRITICAL RULES:
${rules.join("\n")}

=== PLATFORM-SPECIFIC GUIDELINES FOR ${options.platform.toUpperCase()} ===
${platformRule}

=== WHAT MAKES A COMMENT LAND IN 2026 ===
Be aware of current platform dynamics: on LinkedIn, meaningful comments (10+ words, specific) carry more algorithmic weight than likes. Reply threading matters more than volume, so a real question that prompts a reply from the poster is high value. On X/Twitter, brevity and sharp takes win. On Reddit, authenticity and substance beat polish. On all platforms, comments that add a specific observation or a genuine question outperform generic reactions. Write to be read by a human, not to sound impressive.

Now read the post content below and write comments that:
1. Show you understand the specific post (reference real details from it)
2. Add new thinking — don't just react, contribute something original
3. Feel like they were written by a real human in 2026
4. Would earn upvotes/likes/replies from that platform's community
5. Make the original poster glad they shared

First, make a one-line assessment: is there a specific, genuine angle worth engaging with here, or is the post thin (a link with no real content, pure engagement bait, or content you couldn't meaningfully parse)? Prefix this with "ASSESSMENT:" and keep it to one sentence.

Then immediately after, output the comments as a valid JSON array.

OUTPUT FORMAT (two parts, no extra text):
Line 1: ASSESSMENT: <one sentence assessment of the post's substance>
Line 2: <valid JSON array of ${options.commentCount} strings>

IMPORTANT: If your output contains any banned phrases, it has failed. Write like a human, not a bot, not a marketer. A human.`;
}

// ── Response Parser ────────────────────────────────────────────────────────

function parseOutput(raw: string, expectedCount: number): {
  assessment: string;
  comments: string[];
} {
  let result = { assessment: "", comments: [] as string[] };
  if (!raw || raw.trim() === "[]") return result;

  let cleaned = raw.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Extract ASSESSMENT prefix
  const assessmentMatch = cleaned.match(/^ASSESSMENT:\s*(.+?)(?:\.|$)/im);
  if (assessmentMatch) {
    result.assessment = assessmentMatch[1].trim();
    // Remove the assessment line to get to the JSON
    cleaned = cleaned.replace(/^ASSESSMENT:\s*.+/im, "").trim();
  }

  const parseComments = (text: string): string[] => {
    // Try parsing as JSON array
    const arrayMatch = text.match(/^\[[\s\S]*\]$/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: unknown) => String(c).trim()).filter(Boolean);
        }
      } catch {
        // Fall through
      }
    }

    // Try finding an array within the text
    const embeddedMatch = text.match(/\[[\s\S]*?\]/);
    if (embeddedMatch) {
      try {
        const parsed = JSON.parse(embeddedMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: unknown) => String(c).trim()).filter(Boolean);
        }
      } catch {
        // Fall through
      }
    }

    // Try parsing if AI returned an object with comments key
    try {
      const obj = JSON.parse(text);
      if (obj.comments && Array.isArray(obj.comments)) {
        return obj.comments.map((c: unknown) => String(c).trim()).filter(Boolean);
      }
      if (obj.responses && Array.isArray(obj.responses)) {
        return obj.responses.map((c: unknown) => String(c).trim()).filter(Boolean);
      }
    } catch {
      // Fall through
    }

    // Last resort: split by double newlines or numbered items
    const splitByNewlines = text
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && !s.startsWith("{") && !s.startsWith("<"));
    if (splitByNewlines.length >= expectedCount) {
      return splitByNewlines.slice(0, expectedCount);
    }

    // Split by numbered items (e.g., "1. comment" or "1) comment")
    const numbered = text
      .split(/\d+[.)]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    if (numbered.length >= expectedCount) {
      return numbered.slice(0, expectedCount);
    }

    return [];
  };

  result.comments = parseComments(cleaned);
  return result;
}

// ── Main Handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "You must be logged in to generate comments." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Service configuration error. Please try again later.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Your session has expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rateLimit = await checkRateLimit(supabase, user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `You've reached the rate limit. Please wait ${rateLimit.retryAfter} seconds before generating more comments.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("AI service is not configured. Please contact support.");
    }

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
    let postContent = (content || "").trim();

    // ── Single AbortController for all Groq calls (OCR + generation) ──
    const groqController = new AbortController();
    const groqTimeout = setTimeout(() => groqController.abort(), 45_000);

    // ── URL Mode: Actually fetch the URL content ──
    if (input_type === "url") {
      if (!postContent) {
        throw new Error("Please paste a URL to fetch content from.");
      }
      const fetched = await fetchUrlContent(postContent);
      postContent = formatUrlContent(fetched, platform || "social media");
    }

    // ── Image Mode: Extract text via OCR ──
    if (input_type === "image" && image_base64) {
      postContent = await extractImageText(image_base64, GROQ_API_KEY, GROQ_BASE_URL, groqController.signal);
    }

    // ── GitHub Repo Mode: Fetch repo info and README ──
    if (input_type === "github") {
      if (!postContent) throw new Error("Please paste a GitHub repository URL.");
      const fetched = await fetchGitHubContent(postContent);
      postContent = formatUrlContent(fetched, platform || "GitHub");
    }

    // ── npm Package Mode: Fetch package info and README ──
    if (input_type === "npm") {
      if (!postContent) throw new Error("Please paste an npm package name or URL.");
      const fetched = await fetchNpmContent(postContent);
      postContent = formatUrlContent(fetched, platform || "GitHub");
    }

    if (!postContent) {
      clearTimeout(groqTimeout);
      return new Response(
        JSON.stringify({ error: "No content to generate comments for. Please provide text, a URL, an image, a GitHub repo, or an npm package." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Truncate content to prevent excessive token usage
    if (postContent.length > 12000) {
      postContent = postContent.slice(0, 12000) + "\n\n[... content truncated for length]";
    }

    // ── Fetch profile (AI Memory) for voice personalization ──
    let profile: { full_name?: string; profession?: string; industry?: string;
      target_audience?: string; use_case?: string } = {};
    let voiceSamples: string[] = [];
    let plan = "free";
    try {
      const [profileResult, voiceResult, subResult] = await Promise.all([
        supabase.from("profiles").select("full_name, profession, industry, target_audience, use_case").eq("user_id", user.id).maybeSingle(),
        supabase.from("voice_samples").select("content").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      if (profileResult.data) profile = profileResult.data;
      if (voiceResult.data) voiceSamples = voiceResult.data.map((s: { content: string }) => s.content);
      if (subResult.data) plan = subResult.data.plan;
    } catch {
      // Non-critical: continue without profile if fetch fails
    }

    // ── Pro feature gating ──
    if (plan !== "pro") {
      if (commentCount > 3) {
        return new Response(
          JSON.stringify({ error: "Free plan is limited to 3 variations. Upgrade to Pro for up to 5." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (language !== "en") {
        return new Response(
          JSON.stringify({ error: "Free plan supports English only. Upgrade to Pro for 9 languages." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const systemPrompt = buildSystemPrompt({
      tone: tone || "Professional",
      length: length || "Medium",
      platform: platform || "LinkedIn",
      language,
      includeEmoji: include_emoji,
      includeHashtags: include_hashtags,
      includeCta: include_cta,
      commentCount,
      single: single === "true",
      variationNumber: variation_number || null,
      profile,
      voiceSamples,
    });

    // ── Call Groq API with automatic model fallback ──
    // If the primary model returns 404/model_not_found, next fallback is tried automatically.
    const textConfig = getModelConfig(
      "GROQ_MODEL",
      "GROQ_FALLBACK_MODELS",
      "llama-3.3-70b-versatile",
      ["llama-3.1-8b-instant", "openai/gpt-oss-20b", "qwen/qwen3-32b"],
    );

    const { data: groqData } = await callGroqWithFallback(
      GROQ_BASE_URL,
      GROQ_API_KEY,
      textConfig,
      (model) => ({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the post content to comment on:\n\n${postContent}` },
        ],
      }),
      groqController.signal,
      "Comment generation",
    );

    clearTimeout(groqTimeout);

    const rawOutput = (groqData.choices as any)?.[0]?.message?.content || "";

    if (!rawOutput) {
      throw new Error("AI returned an empty response. Please try again.");
    }

    const parsed = parseOutput(rawOutput, commentCount);

    if (!parsed.comments.length) {
      throw new Error("Could not parse AI response. Please try again.");
    }

    // Ensure we return exactly the requested count
    const finalComments = parsed.comments.slice(0, commentCount);

    return new Response(
      JSON.stringify({
        comments: finalComments,
        assessment: parsed.assessment || undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const err = e as any;
    const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    const status = err.statusCode === 429 ? 429 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
