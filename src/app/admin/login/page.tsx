"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { loginAction } from "./actions";
import { ArrowLeft, LogIn, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("/admin");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("next");
    if (p && p.startsWith("/admin")) setNext(p);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("next", next);
    try {
      const res = await loginAction(fd);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
      // sukses → server action redirect otomatis
    } catch {
      // redirect() melempar error internal Next yang menandakan navigasi — abaikan
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-500 text-pine-500 transition hover:text-pine-700"
        >
          <ArrowLeft size={15} /> Kembali ke beranda
        </Link>

        <div className="rounded-3xl border border-pine-100 bg-white/80 p-7 shadow-lift backdrop-blur">
          <Logo />
          <div className="mt-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine-50 text-pine-600">
              <Lock size={17} />
            </span>
            <div>
              <h1 className="font-display text-xl font-600 text-pine-800">Masuk Petugas</h1>
              <p className="text-xs text-pine-500">Panel manajemen distribusi pupuk subsidi</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-600 text-pine-600">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="petugas@kiostani.id"
                className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none transition focus:border-pine-400"
              />
            </div>
            <div>
              <label className="text-xs font-600 text-pine-600">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none transition focus:border-pine-400"
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-600 text-paper transition hover:bg-pine-800 disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading ? "Memeriksa…" : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-pine-400">
          Akun petugas dibuat di Supabase (Authentication → Users).
        </p>
      </div>
    </main>
  );
}
