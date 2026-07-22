"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = supabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email atau kata sandi salah.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form
        onSubmit={handleLogin}
        className="bg-white border border-neutral-200 rounded-2xl p-6 w-full max-w-sm"
      >
        <h1 className="text-lg font-semibold mb-1">Masuk</h1>
        <p className="text-sm text-neutral-500 mb-5">
          Khusus staff — hubungi admin kalau belum punya akun.
        </p>

        <label className="block mb-3">
          <span className="text-xs text-neutral-500 block mb-1">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs text-neutral-500 block mb-1">Kata sandi</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </label>

        {error && <p className="text-sm text-coral mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-lg py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
