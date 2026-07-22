-- Jalankan file ini di Supabase Dashboard > SQL Editor

create extension if not exists "pgcrypto";

-- Data pelanggan, satu baris per nomor internet
create table if not exists customers (
  nomor_internet text primary key,
  nomor_pelanggan text,
  nama text not null,
  telepon text,
  alamat text,
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Riwayat kejadian (pasang baru / gangguan), banyak baris per nomor internet
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  nomor_internet text not null references customers(nomor_internet) on delete cascade,
  jenis text not null check (jenis in ('pasang_baru', 'gangguan')),
  status text not null check (status in ('selesai', 'diproses', 'belum')) default 'diproses',
  tanggal date not null default current_date,
  keterangan text,
  ditangani_oleh text,
  created_at timestamptz not null default now()
);

create index if not exists idx_history_nomor_internet on history(nomor_internet);
create index if not exists idx_history_tanggal on history(tanggal desc);

-- Row Level Security: diaktifkan sebagai lapisan pertahanan kedua.
-- API route sudah mengecek sesi login staff sebelum memanggil service role
-- key (yang otomatis melewati RLS). Policy di bawah ini menjaga agar data
-- tetap aman kalau suatu saat ada kode lain yang mengakses tabel memakai
-- anon key langsung dari browser (tanpa lewat API route).
alter table customers enable row level security;
alter table history enable row level security;

create policy "staff bisa baca customers" on customers for select
  using (auth.role() = 'authenticated');
create policy "staff bisa insert customers" on customers for insert
  with check (auth.role() = 'authenticated');
create policy "staff bisa update customers" on customers for update
  using (auth.role() = 'authenticated');

create policy "staff bisa baca history" on history for select
  using (auth.role() = 'authenticated');
create policy "staff bisa insert history" on history for insert
  with check (auth.role() = 'authenticated');
