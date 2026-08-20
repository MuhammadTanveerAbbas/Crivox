import { createClient } from "@supabase/supabase-js";

const SUPABASE_CHECK_TIMEOUT_MS = 10_000;

export default async function handler(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Database connection timed out")),
      SUPABASE_CHECK_TIMEOUT_MS,
    )
  );

  const query = supabase.from("profiles").select("id").limit(1).maybeSingle();
  const { error } = await Promise.race([query, timeout]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, message: "Keep-alive ping completed" }), {
    headers: { "Content-Type": "application/json" },
  });
}
