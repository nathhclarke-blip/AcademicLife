import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Sign in</h2>
      <p className="text-sm text-slate-600">
        Use Supabase hosted UI or your custom auth form in production. This starter keeps auth logic server-driven.
      </p>
    </div>
  );
}
