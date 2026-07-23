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
    
    // 1. Cek apakah tabel dan data user ditemukan
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("totp_secret")
      .eq("email", email)
      .single();

    if (profileError) {
      console.error("Supabase Profile Error:", profileError);
      return NextResponse.json({ error: `Database Error: ${profileError.message}` }, { status: 400 });
    }

    if (!profile?.totp_secret) {
      return NextResponse.json({ error: "Konfigurasi Authenticator (totp_secret) kosong untuk email ini" }, { status: 400 });
    }

    // 2. Pastikan token dibersihkan dari spasi
    const cleanToken = String(token).trim();
    const cleanSecret = String(profile.totp_secret).trim();

    // Verifikasi token 6 digit dengan otplib
    const isValid = authenticator.check(cleanToken, cleanSecret);

    if (!isValid) {
      return NextResponse.json({ error: "Kode verifikasi salah atau sudah kedaluwarsa" }, { status: 401 });
    }

    // 3. Buat magic link via Supabase Auth Admin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hisotry-magang.vercel.app";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Supabase Generate Link Error:", linkError);
      return NextResponse.json({ error: `Gagal membuat sesi: ${linkError?.message || 'Unknown error'}` }, { status: 500 });
    }

    return NextResponse.json({ url: linkData.properties.action_link });
  } catch (err) {
    console.error("Fatal API Error:", err);
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}