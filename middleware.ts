import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const { maxAge, expires, ...sessionCookieOptions } = options;
          request.cookies.set({ name, value, ...sessionCookieOptions });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...sessionCookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // BYPASS MUTLAK: Biarkan semua endpoint API auth (/api/auth/*) diakses tanpa cek sesi
  if (pathname.startsWith("/api/auth/")) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = pathname.startsWith("/login");
  const isAuthFlowRoute = pathname.startsWith("/auth/callback");

  // Belum login dan bukan di halaman login/callback -> lempar ke /login
  if (!user && !isLoginPage && !isAuthFlowRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Sudah login tapi buka /login -> lempar ke beranda
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};