"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

type Customer = {
  nomor_internet: string;
  nomor_pelanggan: string | null;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  foto_url: string | null;
};
type HistoryRow = {
  id: string;
  jenis: "pasang_baru" | "gangguan";
  status: "selesai" | "diproses" | "belum";
  tanggal: string;
  keterangan: string | null;
};

const badgeClass: Record<string, string> = {
  selesai: "bg-accent-soft text-accent",
  diproses: "bg-amber-soft text-amber",
  belum: "bg-coral-soft text-coral",
};
const statusLabel: Record<string, string> = {
  selesai: "Selesai",
  diproses: "Diproses",
  belum: "Belum ditangani",
};

export default function DetailPage() {
  const params = useParams();
  const nomor = decodeURIComponent(params.nomor as string);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/customers/${encodeURIComponent(nomor)}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setCustomer(json.customer);
      setHistory(json.history || []);
      setLoading(false);
    })();
  }, [nomor]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 mb-4 inline-block">
        ← Kembali ke riwayat
      </Link>

      {loading && <p className="text-sm text-neutral-400">Memuat data...</p>}
      {!loading && notFound && (
        <p className="text-sm text-neutral-500">Nomor internet tidak ditemukan.</p>
      )}

      {!loading && customer && (
        <>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center font-semibold text-sm">
                {customer.nama.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
              </div>
              <div>
                <p className="font-semibold text-base">{customer.nama}</p>
                <p className="text-sm text-neutral-500">
                  Nomor internet: {customer.nomor_internet}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 pt-4 text-sm">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Nomor pelanggan</p>
                <p>{customer.nomor_pelanggan || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Telepon</p>
                <p>{customer.telepon || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-400 mb-0.5">Alamat</p>
                <p>{customer.alamat || "-"}</p>
              </div>
            </div>
          </div>

          <p className="font-semibold text-sm mb-2">Foto rumah</p>
          <div className="mb-6">
            {customer.foto_url ? (
              <div className="relative w-full max-w-xs aspect-video rounded-[10px] overflow-hidden border border-neutral-200">
                <Image src={customer.foto_url} alt="Foto rumah pelanggan" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-video rounded-[10px] border border-neutral-200 bg-white flex items-center justify-center text-neutral-300 text-sm">
                Belum ada foto
              </div>
            )}
          </div>

          <p className="font-semibold text-sm mb-2">Riwayat ({history.length})</p>
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex gap-3 items-start bg-white border border-neutral-200 rounded-[10px] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {h.jenis === "pasang_baru" ? "Pasang baru" : "Gangguan"}
                    {h.keterangan ? ` — ${h.keterangan}` : ""}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(h.tanggal).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={`ml-auto text-xs rounded-full px-2.5 py-1 whitespace-nowrap ${badgeClass[h.status]}`}
                >
                  {statusLabel[h.status]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
