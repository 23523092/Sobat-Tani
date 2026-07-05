"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft, CheckCircle2, AlertCircle, Send, Clock } from "lucide-react";
import { daftarPetani } from "./actions";

const KOMODITAS = [
  "Padi",
  "Jagung",
  "Kedelai",
  "Cabai",
  "Bawang Merah",
  "Bawang Putih",
  "Kopi",
  "Tebu",
  "Kakao",
  "Ubi Kayu",
];

export default function DaftarPage() {
  const [err, setErr] = useState("");
  const [sukses, setSukses] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const input = {
      nik: String(fd.get("nik") || ""),
      noTelp: String(fd.get("noTelp") || ""),
      nama: String(fd.get("nama") || ""),
      kelompokTani: String(fd.get("kelompokTani") || ""),
      desa: String(fd.get("desa") || ""),
      kecamatan: String(fd.get("kecamatan") || ""),
      luasLahanHa: Number(fd.get("luasLahanHa") || 0),
      komoditas: String(fd.get("komoditas") || ""),
    };
    start(async () => {
      const res = await daftarPetani(input);
      if (!res.ok) return setErr(res.error || "Pendaftaran gagal.");
      setSukses(true);
    });
  }

  return (
    <main className="min-h-screen bg-paper bg-grain">
      <header className="border-b border-pine-100 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded-full border border-pine-200 text-pine-600 transition hover:bg-white/60"
            aria-label="Kembali"
          >
            <ArrowLeft size={17} />
          </Link>
          <Logo />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-10">
        {sukses ? (
          <div className="rounded-3xl border border-pine-100 bg-white/80 p-8 text-center shadow-lift">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine-50 text-pine-600">
              <CheckCircle2 size={28} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-600 text-pine-800">Pendaftaran terkirim!</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-pine-600">
              Data Anda masuk antrean verifikasi petugas. Status akan berubah menjadi{" "}
              <b>Terdaftar</b> setelah disetujui, lalu alokasi pupuk Anda terbit. Cek berkala di
              Asisten Tani dengan NIK Anda.
            </p>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-pine-400">
              <Clock size={13} /> Menunggu verifikasi
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/asisten" className="rounded-full bg-pine-700 px-5 py-2.5 text-sm font-600 text-paper transition hover:bg-pine-800">
                Buka Asisten Tani
              </Link>
              <Link href="/" className="rounded-full border border-pine-200 px-5 py-2.5 text-sm font-600 text-pine-700 transition hover:bg-white/60">
                Beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">e-RDKK</span>
            <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Daftar Petani Penerima Subsidi</h1>
            <p className="mt-2 text-sm leading-relaxed text-pine-600">
              Ajukan diri sebagai penerima pupuk subsidi. Petugas akan memverifikasi data Anda sebelum alokasi terbit. Subsidi hanya untuk lahan maksimal 2 hektar.
            </p>

            <form onSubmit={onSubmit} className="mt-7 rounded-3xl border border-pine-100 bg-white/80 p-6 shadow-card md:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama lengkap" name="nama" placeholder="Sesuai KTP" required className="sm:col-span-2" />
                <Field label="NIK (16 digit)" name="nik" placeholder="1371…" inputMode="numeric" maxLength={16} required />
                <Field label="Nomor telepon" name="noTelp" placeholder="0812…" inputMode="tel" required />
                <Field label="Kelompok tani" name="kelompokTani" placeholder="Mis. Tani Saiyo" required />
                <div>
                  <label className="text-xs font-600 text-pine-600">Komoditas utama</label>
                  <select
                    name="komoditas"
                    required
                    defaultValue=""
                    className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
                  >
                    <option value="" disabled>
                      Pilih komoditas
                    </option>
                    {KOMODITAS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Desa" name="desa" placeholder="Nama desa" required />
                <Field label="Kecamatan" name="kecamatan" placeholder="Nama kecamatan" required />
                <div>
                  <label className="text-xs font-600 text-pine-600">Luas lahan (ha)</label>
                  <input
                    name="luasLahanHa"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2"
                    placeholder="mis. 1.2"
                    required
                    className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
                  />
                </div>
              </div>

              {err && (
                <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
                  <AlertCircle size={14} /> {err}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-600 text-paper transition hover:bg-pine-800 disabled:opacity-50"
              >
                <Send size={16} /> {pending ? "Mengirim…" : "Kirim Pendaftaran"}
              </button>
              <p className="mt-3 text-center text-xs text-pine-400">
                Dengan mendaftar, data Anda akan diverifikasi terhadap syarat e-RDKK.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  inputMode,
  maxLength,
  className = "",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "tel" | "text";
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-600 text-pine-600">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
      />
    </div>
  );
}
