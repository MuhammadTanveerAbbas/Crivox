import { createClient } from "@supabase/supabase-js";

const SUPABASE_CHECK_TIMEOUT_MS = 10_000;

export default async function handler(_req: Request) {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Supabase not configured",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    const duration = Date.now() - start;

    if (error) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Service is healthy",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        version: "1.0.0",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    const duration = Date.now() - start;
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
