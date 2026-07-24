import { NextResponse } from "next/server";
import { verify } from "otplib";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteClient } from "@/lib/supabase/server";

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

    let result;
    try {
      result = await verify({
        secret: String(profile.totp_secret).trim(),
        token: String(token).trim(),
      });
    } catch (verifyErr) {
      // contoh: SecretTooShortError kalau secret di DB kurang dari 16 byte setelah decode base32
      return NextResponse.json(
        { error: `Gagal verifikasi kode: ${verifyErr.message}` },
        { status: 400 }
      );
    }

    if (!result?.valid) {
      return NextResponse.json({ error: "Kode verifikasi salah atau sudah kedaluwarsa" }, { status: 401 });
    }

    // Jika valid, minta Supabase generate token verifikasi (bukan link langsung,
    // karena action_link dari generateLink selalu pakai format lama #access_token
    // yang tidak bisa ditangkap di server / route handler).
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const hashedToken = linkData?.properties?.hashed_token;

    if (linkError || !hashedToken) {
      // SEMENTARA untuk debug: tampilkan pesan error asli dari Supabase.
      return NextResponse.json(
        { error: `Gagal membuat sesi login: ${linkError?.message ?? "hashedToken kosong"}` },
        { status: 500 }
      );
    }

    // Tukar token_hash jadi sesi LANGSUNG di sini, pakai client yang sadar-cookie,
    // supaya cookie sesi langsung ter-set di response request ini juga.
    const supabaseRoute = createRouteClient();
    const { error: verifyError } = await supabaseRoute.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (verifyError) {
      // SEMENTARA untuk debug: tampilkan pesan error asli dari Supabase.
      return NextResponse.json(
        { error: `Gagal memverifikasi sesi login: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // Sesi sudah ter-set lewat cookie di response ini. Client tinggal redirect ke "/".
    return NextResponse.json({ url: "/" });
  } catch (err) {
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}