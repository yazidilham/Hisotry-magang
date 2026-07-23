import { NextResponse, type NextRequest } from "next/server";
import { verifyTelegramAuth, type TelegramAuthData } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN belum diset di server" },
      { status: 500 }
    );
  }

  let data: TelegramAuthData;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  // Verifikasi keaslian data dari Telegram Widget
  const check = verifyTelegramAuth(data, botToken);
  if (!check.valid) {
    return NextResponse.json({ error: check.reason || "Autentikasi Telegram gagal" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // Setiap akun Telegram dipetakan ke satu email "dummy" yang unik & stabil.
  const email = `tg-${data.id}@telegram.local`;

  // Cek apakah user sudah ada atau buat baru
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      provider: "telegram",
      telegram_id: data.id,
      telegram_username: data.username ?? null,
      first_name: data.first_name,
      last_name: data.last_name ?? null,
      photo_url: data.photo_url ?? null,
    },
  });

  // Jika error selain karena user sudah terdaftar (already exists), hentikan proses
  if (createError && !createError.message.toLowerCase().includes("already") && !createError.message.toLowerCase().includes("already registered")) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Gunakan domain production langsung untuk menghindari ketidakcocokan origin dari request proxy Vercel
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hisotry-magang.vercel.app";

  // Generate magic link untuk login otomatis
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? "Gagal membuat sesi login" },
      { status: 500 }
    );
  }

  // Kembalikan URL action link agar frontend bisa langsung mengarahkan pengguna masuk
  return NextResponse.json({ url: linkData.properties.action_link });
}