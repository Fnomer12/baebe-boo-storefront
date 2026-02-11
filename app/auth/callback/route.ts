import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/cart";

  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Exchanges the code for a session (important step)
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
