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

  const check = verifyTelegramAuth(data, botToken);
  if (!check.valid) {
    return NextResponse.json({ error: check.reason }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // Setiap akun Telegram dipetakan ke satu email "dummy" yang unik & stabil.
  // Ini bukan email asli, cuma dipakai sebagai identifier internal Supabase Auth.
  const email = `tg-${data.id}@telegram.local`;

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

  // Kalau errornya "sudah terdaftar", itu wajar (user login kedua kali dst) -> lanjut.
  // Selain itu, itu error asli -> hentikan.
  if (createError && !createError.message.toLowerCase().includes("already")) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // PENTING: hanya izinkan akun yang memang sudah didaftarkan admin lewat
  // Supabase Dashboard (lihat README bagian "Login staff"). Kalau kamu ingin
  // SIAPA SAJA yang klik tombol Telegram otomatis jadi staff, hapus blok ini.
  //
  // const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  // const isPreApproved = userList?.users.some((u) => u.email === email);
  // if (!isPreApproved) {
  //   return NextResponse.json({ error: "Akun ini belum diberi akses" }, { status: 403 });
  // }

  const origin = request.nextUrl.origin;
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? "Gagal membuat sesi login" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: linkData.properties.action_link });
}
