import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { publicOrigin } from "../../../lib/http";

// The link in the sign-in email lands here. Exchange its code for a session, then
// continue to the page the person started from.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = publicOrigin(request);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/?view=app";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/?view=app";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/?view=app&signin=failed", origin));
}
