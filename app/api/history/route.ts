import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServerClient } from "@/lib/supabaseServer";

async function requireStaff() {
  const auth = supabaseServerClient();
  const { data: { session } } = await auth.auth.getSession();
  return session;
}

// GET /api/history?q=0812345678&jenis=gangguan
export async function GET(req: NextRequest) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const jenis = req.nextUrl.searchParams.get("jenis") || "";

  let query = supabase
    .from("history")
    .select("*, customers(nama, nomor_pelanggan)")
    .order("tanggal", { ascending: false });

  if (jenis) query = query.eq("jenis", jenis);
  if (q) query = query.ilike("nomor_internet", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

// POST /api/history — bikin/perbarui data pelanggan + tambah 1 baris riwayat
export async function POST(req: NextRequest) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const body = await req.json();

  const {
    nomorInternet,
    nomorPelanggan,
    nama,
    telepon,
    alamat,
    foto,
    jenis,
    status,
    tanggal,
    keterangan,
  } = body;

  if (!nomorInternet || !nama || !jenis) {
    return NextResponse.json(
      { error: "nomorInternet, nama, dan jenis wajib diisi." },
      { status: 400 }
    );
  }

  // upsert data pelanggan (kalau nomor sudah ada, update; kalau belum, buat baru)
  const { error: customerError } = await supabase.from("customers").upsert(
    {
      nomor_internet: nomorInternet,
      nomor_pelanggan: nomorPelanggan || null,
      nama,
      telepon: telepon || null,
      alamat: alamat || null,
      foto_url: foto || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "nomor_internet" }
  );

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  const { data, error: historyError } = await supabase
    .from("history")
    .insert({
      nomor_internet: nomorInternet,
      jenis,
      status: status || "diproses",
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      keterangan: keterangan || null,
    })
    .select()
    .single();

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
export async function DELETE(req: NextRequest) {
  const session = await requireStaff();

  if (!session) {
    return NextResponse.json(
      { error: "Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID tidak ditemukan." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const { error } = await supabase
    .from("history")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
