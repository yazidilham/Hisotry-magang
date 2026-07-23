import { NextResponse } from "next/server";
import otplib from "otplib";
const { authenticator } = otplib;
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 });
    }

    // Catatan: Di tahap setup awal, secret key user harus disimpan ke Database (Supabase)
    // Di sini kita ambil contoh secret key yang diasumsikan sudah tersimpan di database berdasarkan email user.
    const supabaseAdmin = createAdminClient();
    
    // Ambil data user atau secret TOTP mereka dari database (misal dari tabel profiles)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("totp_secret")
      .eq("email", email)
      .single();

    if (profileError || !profile?.totp_secret) {
      return NextResponse.json({ error: "Konfigurasi Authenticator tidak ditemukan untuk akun ini" }, { status: 400 });
    }

    // Verifikasi token 6 digit dengan otplib
    const isValid = authenticator.check(token, profile.totp_secret);

    if (!isValid) {
      return NextResponse.json({ error: "Kode verifikasi salah atau sudah kedaluwarsa" }, { status: 401 });
    }

    // Jika valid, buat magic link / sesi login otomatis via Supabase
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
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}