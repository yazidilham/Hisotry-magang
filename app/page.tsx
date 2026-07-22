"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabaseBrowser";

type HistoryRow = {
  id: string;
  nomor_internet: string;
  jenis: "pasang_baru" | "gangguan";
  status: "selesai" | "diproses" | "belum";
  tanggal: string;
  keterangan: string | null;
  customers: { nama: string; nomor_pelanggan: string | null } | null;
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

export default function HomePage() {
  const router = useRouter();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [q, setQ] = useState("");
  const [jenisFilter, setJenisFilter] = useState<"" | "pasang_baru" | "gangguan">("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nomorInternet: "",
    nomorPelanggan: "",
    nama: "",
    telepon: "",
    alamat: "",
    foto: "",
    jenis: "pasang_baru" as "pasang_baru" | "gangguan",
    status: "diproses" as "selesai" | "diproses" | "belum",
    tanggal: "",
    keterangan: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (jenisFilter) params.set("jenis", jenisFilter);
    const res = await fetch(`/api/history?${params.toString()}`);
    const json = await res.json();
    setRows(json.data || []);
    setLoading(false);
  }, [q, jenisFilter]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250); // debounce search
    return () => clearTimeout(t);
  }, [fetchData]);

  async function handleSave() {
    if (!form.nomorInternet || !form.nama) {
      alert("Nomor internet dan nama wajib diisi.");
      return;
    }

    const supabase = supabaseBrowserClient();
    let fotoUrl = "";

    if (imageFile) {
      const fileName = `rumah-${Date.now()}-${imageFile.name}`;

      const { error } = await supabase.storage
        .from("foto-rumah")
        .upload(fileName, imageFile);

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("foto-rumah")
        .getPublicUrl(fileName);

      fotoUrl = data.publicUrl;
    }

    const res = await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        foto: fotoUrl,
      }),
    });

    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Gagal menyimpan.");
      return;
    }

    setShowModal(false);
    setForm({
      nomorInternet: "",
      nomorPelanggan: "",
      nama: "",
      telepon: "",
      alamat: "",
      foto: "",
      jenis: "pasang_baru",
      status: "diproses",
      tanggal: "",
      keterangan: "",
    });

    setImageFile(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    const ok = confirm("Yakin ingin menghapus history ini?");
    if (!ok) return;

    const res = await fetch(`/api/history?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error);
      return;
    }

    fetchData();
  }

  async function handleLogout() {
    const supabase = supabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex justify-between items-end gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat pelanggan</h1>
          <p className="text-sm text-neutral-500">
            Data pasang baru dan gangguan berdasarkan nomor internet
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-[#194a3f]"
          >
            + Tambah history
          </button>
          <button
            onClick={handleLogout}
            className="border border-neutral-300 rounded-lg px-4 py-2 text-sm bg-white"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center mb-5 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nomor internet"
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px] max-w-[340px]"
        />
        <div className="flex gap-2">
          {[
            { v: "", l: "Semua" },
            { v: "pasang_baru", l: "Pasang baru" },
            { v: "gangguan", l: "Gangguan" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setJenisFilter(f.v as any)}
              className={`rounded-full px-4 py-1.5 text-sm border ${
                jenisFilter === f.v
                  ? "bg-accent text-white border-accent"
                  : "border-neutral-300 bg-white"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {loading && <p className="text-sm text-neutral-400">Memuat data...</p>}
        {!loading && rows.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Belum ada data yang cocok. Coba kata kunci lain atau tambah history baru.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <Link
              href={`/pelanggan/${encodeURIComponent(r.nomor_internet)}`}
              className="flex-1 flex gap-3 items-start bg-white border border-neutral-200 rounded-[10px] px-4 py-3 hover:border-neutral-400"
            >
              <div>
                <p className="text-sm font-semibold">
                  {r.jenis === "pasang_baru" ? "Pasang baru" : "Gangguan"} — {r.customers?.nama || "Tanpa nama"}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {r.nomor_internet} · {new Date(r.tanggal).toLocaleDateString("id-ID")}
                </p>
              </div>

              <span className={`ml-auto text-xs rounded-full px-2.5 py-1 whitespace-nowrap ${badgeClass[r.status]}`}>
                {statusLabel[r.status]}
              </span>
            </Link>

            <button
              onClick={() => handleDelete(r.id)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <h2 className="font-semibold mb-4">Tambah history</h2>
            <div className="flex flex-col gap-3 text-sm">
              <Field label="Nomor internet">
                <input
                  value={form.nomorInternet}
                  onChange={(e) => setForm({ ...form, nomorInternet: e.target.value })}
                  placeholder="0812345678-INET"
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor pelanggan">
                  <input
                    value={form.nomorPelanggan}
                    onChange={(e) => setForm({ ...form, nomorPelanggan: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Nama pelanggan">
                  <input
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jenis">
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value as any })}
                    className="input"
                  >
                    <option value="pasang_baru">Pasang baru</option>
                    <option value="gangguan">Gangguan</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="selesai">Selesai</option>
                    <option value="diproses">Diproses</option>
                    <option value="belum">Belum ditangani</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal">
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Telepon">
                  <input
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Alamat">
                <input
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Foto rumah">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                  className="input"
                />
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="mt-2 rounded-lg"
                    width={200}
                  />
                )}
              </Field>
              <Field label="Keterangan">
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  rows={2}
                  className="input"
                />
              </Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-accent text-white rounded-lg py-2 text-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          border: 1px solid #e4e1d8;
          border-radius: 8px;
          padding: 8px 12px;
          width: 100%;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}