import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRO_PRICE_ID;
const appUrl = process.env.VITE_APP_URL || "https://crivox.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripeApiKey || !priceId) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID." });
  }

  const { user_id, email } = req.body;
  if (!user_id || !email) {
    return res.status(400).json({ error: "Missing user_id or email" });
  }

  try {
    const stripe = await import("stripe");
    const client = new stripe.default(stripeApiKey, { apiVersion: "2025-02-24.acacia" });

    const session = await client.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: user_id,
      metadata: { user_id },
      success_url: `${appUrl}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return res.status(500).json({ error: message });
  }
}
