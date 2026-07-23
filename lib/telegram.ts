import crypto from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Data dari widget dianggap kadaluarsa setelah 5 menit,
// supaya link/payload lama tidak bisa dipakai ulang (replay attack).
const MAX_AUTH_AGE_SECONDS = 60 * 5;

export function verifyTelegramAuth(
  data: TelegramAuthData,
  botToken: string
): { valid: boolean; reason?: string } {
  const { hash, ...fields } = data;

  if (!hash) return { valid: false, reason: "hash tidak ada" };
  if (!data.id || !data.auth_date) {
    return { valid: false, reason: "data tidak lengkap" };
  }

  // Algoritma resmi Telegram Login Widget:
  // secret_key = SHA256(bot_token)
  // hash = HMAC_SHA256(data_check_string, secret_key)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${(fields as Record<string, unknown>)[key]}`)
    .join("\n");

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  // timingSafeEqual butuh panjang buffer sama, jaga-jaga hash corrupt
  const a = Buffer.from(computedHash);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "hash tidak cocok" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - data.auth_date;
  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    return { valid: false, reason: "data auth sudah kadaluarsa, coba login ulang" };
  }

  return { valid: true };
}
