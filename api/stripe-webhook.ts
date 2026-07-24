import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripeApiKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Stripe webhook not configured" });
  }

  try {
    const stripe = await import("stripe");
    const client = new stripe.default(stripeApiKey, { apiVersion: "2025-02-24.acacia" });

    const sig = req.headers["stripe-signature"] as string;
    const buf = Buffer.from(JSON.stringify(req.body));
    const event = client.webhooks.constructEvent(buf, sig, webhookSecret);

    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id || session.client_reference_id;
        if (userId) {
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: "pro",
            status: "active",
            current_period_end: new Date((session.expires_at || 0) * 1000).toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (subs) {
          await supabase.from("subscriptions").update({
            status: subscription.status === "active" ? "active" : "canceled",
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            plan: subscription.status === "active" ? "pro" : "free",
          }).eq("user_id", subs.user_id);
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return res.status(400).json({ error: message });
  }
}
