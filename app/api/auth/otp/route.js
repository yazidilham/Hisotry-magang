import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Ambil data secret TOTP berdasarkan email user dari tabel profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("totp_secret")
      .eq("email", email)
      .single();

    if (profileError || !profile?.totp_secret) {
      return NextResponse.json({ error: "Konfigurasi Authenticator tidak ditemukan untuk akun ini" }, { status: 400 });
    }

    const isValid = authenticator.check(String(token).trim(), String(profile.totp_secret).trim());

    if (!isValid) {
      return NextResponse.json({ error: "Kode verifikasi salah atau sudah kedaluwarsa" }, { status: 401 });
    }

    // Jika valid, buat magic link via Supabase Auth Admin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hisotry-magang.vercel.app";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: "Gagal membuat sesi login" }, { status: 500 });
    }

    return NextResponse.json({ url: linkData.properties.action_link });
  } catch (err) {
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}