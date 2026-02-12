import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id,email")
    .eq("id", user.id)
    .single();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.email ?? user.email,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`
  });

  return NextResponse.redirect(session.url ?? `${env.NEXT_PUBLIC_APP_URL}/billing`);
}
