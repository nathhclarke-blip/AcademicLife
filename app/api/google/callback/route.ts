import { google } from "googleapis";
import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);

  await supabase
    .from("google_connections")
    .upsert({ user_id: user.id, refresh_token: tokens.refresh_token, scope: tokens.scope });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/calendar?google=connected`);
}
