import { NextResponse, type NextRequest } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Gagal memverifikasi sesi login");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}