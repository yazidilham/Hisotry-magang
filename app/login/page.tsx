"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal verifikasi kode");
        setLoading(false);
        return;
      }

      // Alihkan ke sesi login jika berhasil
      window.location.href = data.url;
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-accent-soft px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-accent mb-1">
          Riwayat Pelanggan
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Login Staff via Google Authenticator
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Email Staff</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">Kode Google Authenticator (6 Digit)</label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg text-center tracking-widest text-lg font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium text-sm mt-2 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}