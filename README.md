# Riwayat Pelanggan

Aplikasi internal untuk mencatat riwayat pasang baru dan gangguan pelanggan
berdasarkan nomor internet. Next.js (App Router) + Supabase (Postgres + Storage).

## Struktur

```
app/
  page.tsx                     halaman list + search + tambah history
  pelanggan/[nomor]/page.tsx   halaman detail per nomor internet
  api/history/route.ts         GET (list/search), POST (tambah)
  api/customers/[nomor]/route.ts  GET detail + riwayat 1 nomor
lib/supabaseClient.ts          koneksi Supabase (server-side only)
supabase/schema.sql            skema tabel, jalankan di Supabase SQL Editor
```

## 1. Setup Supabase (database)

1. Buat akun & project baru di https://supabase.com (gratis untuk tim kecil).
2. Buka **SQL Editor** di dashboard, tempel isi `supabase/schema.sql`, jalankan (Run).
   Ini akan membuat tabel `customers` dan `history`.
3. Buka **Storage** di sidebar > Create bucket > beri nama `foto-rumah` > set jadi **public**
   (supaya foto bisa ditampilkan langsung di halaman detail).
4. Buka **Project Settings > API**, catat:
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (bukan `anon` key) → jadi `SUPABASE_SERVICE_ROLE_KEY`

## 2. Setup project di komputer kamu

```bash
# masuk ke folder project
cd riwayat-pelanggan-app

# copy env, lalu isi dengan nilai dari langkah 1
cp .env.local.example .env.local

# install dependency
npm install

# jalankan
npm run dev
```

Buka http://localhost:3000 — halaman list riwayat pelanggan akan langsung tampil.

## 3. Upload foto rumah

Untuk sekarang, field "Foto rumah" di form Tambah History menerima **URL**.
Cara paling gampang dapat URL-nya:

1. Buka Supabase Dashboard > Storage > bucket `foto-rumah`
2. Upload foto pelanggan di sana
3. Klik foto yang sudah diupload > copy "public URL"
4. Tempel URL itu ke field "Foto rumah" saat tambah history

(Kalau nanti kamu mau upload langsung dari form tanpa buka Supabase dashboard,
itu langkah pengembangan berikutnya — tinggal bilang, saya bantu tambahkan.)

## 4. Deploy supaya bisa diakses tim (bukan cuma localhost)

1. Push folder ini ke repo GitHub baru.
2. Buka https://vercel.com > New Project > import repo tadi.
3. Di bagian Environment Variables, isi `NEXT_PUBLIC_SUPABASE_URL` dan
   `SUPABASE_SERVICE_ROLE_KEY` (sama seperti `.env.local`).
4. Deploy. Vercel akan kasih URL publik (bisa dipakai custom domain juga).

## 5. Login staff (sudah aktif di template ini)

Aplikasi ini sudah dilengkapi login — tidak ada halaman yang bisa diakses
tanpa sesi staff yang valid (dijaga oleh `middleware.ts`).

**Cara menambahkan akun staff:**

1. Buka Supabase Dashboard > **Authentication > Users**
2. Klik **Add user** > isi email staff > pilih **Auto Confirm User** (supaya
   tidak perlu verifikasi email) atau kirim invite biasa
3. Set password awal, lalu kasih tahu staff untuk login di `/login`

Tidak ada pendaftaran akun sendiri (sign up) di aplikasi ini — akun hanya
dibuat oleh admin lewat dashboard, supaya kamu yang mengontrol siapa saja
yang bisa masuk.

## 6. Checklist keamanan

**Sudah otomatis aman lewat Supabase:**
- Data terenkripsi saat disimpan (at-rest) dan saat berpindah (in-transit,
  via TLS) secara default.
- Database tidak terbuka ke publik — hanya bisa diakses lewat API key.

**Sudah ditangani oleh struktur project ini:**
- `SUPABASE_SERVICE_ROLE_KEY` (kunci penuh ke database) hanya hidup di server,
  tidak pernah dikirim ke browser.
- Setiap API route mengecek sesi login staff dulu sebelum mengambil/mengubah
  data — tidak ada endpoint yang bisa diakses tanpa login.
- Row Level Security (RLS) aktif di database sebagai lapisan kedua, jaga-jaga
  kalau nanti ada kode yang mengakses tabel langsung dari browser.

**Perlu kamu lakukan sendiri:**
- [ ] Jangan commit file `.env.local` ke git (`.gitignore` sudah menyiapkan ini)
- [ ] Aktifkan **2FA/MFA** untuk akun Supabase dan Vercel kamu sendiri (bukan
      staff, tapi akun admin yang pegang dashboard)
- [ ] Aktifkan **Point-in-time Recovery / backup harian** di Supabase
      (Settings > Database > Backups) — penting untuk data perusahaan
- [ ] Hapus akun staff yang sudah resign dari Authentication > Users
- [ ] Kalau kredensial pernah bocor, langsung **rotate** service role key di
      Settings > API, lalu update env di Vercel
- [ ] Pertimbangkan batasi akses jaringan (mis. hanya IP kantor) lewat
      Vercel/Cloudflare kalau datanya sangat sensitif

## 7. Pengembangan lanjutan yang bisa ditambahkan

- Upload foto langsung dari form (drag & drop ke Supabase Storage)
- Edit / hapus entri riwayat
- Export data ke Excel
- Notifikasi WhatsApp/SMS ke pelanggan saat status berubah
- Audit log: catat staff mana yang menambah/mengubah data kapan
