import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ACTIVE_SUBSCRIPTION_STATES } from "@/lib/subscription";
import { env } from "@/lib/env";

const publicRoutes = ["/login", "/api/stripe/webhook"];
const subscriptionProtectedRoutes = ["/dashboard", "/calendar"];

export async function middleware(request: NextRequest) {
  if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (subscriptionProtectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile || !ACTIVE_SUBSCRIPTION_STATES.includes(profile.subscription_status)) {
      return NextResponse.redirect(new URL("/billing", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
