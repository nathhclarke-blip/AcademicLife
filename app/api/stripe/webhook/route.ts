import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  const event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET);

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    await supabaseAdmin
      .from("users")
      .update({ subscription_status: subscription.status })
      .eq("stripe_customer_id", subscription.customer as string);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await supabaseAdmin
      .from("users")
      .update({ subscription_status: "inactive" })
      .eq("stripe_customer_id", subscription.customer as string);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
