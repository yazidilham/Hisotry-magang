"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export default function LoginPage() {
  const widgetContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Definisikan fungsi callback auth Telegram
    window.onTelegramAuth = async (user) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Login gagal, coba lagi.");
          setLoading(false);
          return;
        }

        // Alihkan ke URL magic link Supabase yang dikembalikan dari backend
        window.location.href = json.url;
      } catch {
        setError("Terjadi kesalahan jaringan, coba lagi.");
        setLoading(false);
      }
    };

    // 2. Bersihkan kontainer terlebih dahulu untuk mencegah duplikasi script saat hot-reload
    const container = widgetContainer.current;
    if (container) {
      container.innerHTML = "";
    }

    // 3. Buat dan pasang script Telegram Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute(
      "data-telegram-login",
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""
    );
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    container?.appendChild(script);

    // 4. Cleanup saat komponen dilepas (unmount)
    return () => {
      delete window.onTelegramAuth;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-accent-soft px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-accent mb-1">
          Riwayat Pelanggan
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Login staff menggunakan Telegram
        </p>

        {/* Tempat widget Telegram dirender */}
        <div ref={widgetContainer} className="flex justify-center min-h-[40px]" />

        {loading && (
          <p className="mt-4 text-sm text-gray-500">Memproses login...</p>
        )}
        {error && <p className="mt-4 text-sm text-coral">{error}</p>}
      </div>
    </main>
  );
}