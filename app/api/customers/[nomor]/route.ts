import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServerClient } from "@/lib/supabaseServer";

// GET /api/customers/0812345678-INET
export async function GET(
  req: NextRequest,
  { params }: { params: { nomor: string } }
) {
  const auth = supabaseServerClient();
  const { data: { session } } = await auth.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const nomorInternet = decodeURIComponent(params.nomor);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("nomor_internet", nomorInternet)
    .single();

  if (customerError) {
    return NextResponse.json(
      { error: "Nomor internet tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: history, error: historyError } = await supabase
    .from("history")
    .select("*")
    .eq("nomor_internet", nomorInternet)
    .order("tanggal", { ascending: false });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ customer, history });
}
