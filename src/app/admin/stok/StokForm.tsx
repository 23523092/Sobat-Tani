"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, PackagePlus } from "lucide-react";
import { JENIS_LIST, type JenisPupuk, type StokTahunan } from "@/lib/data";
import { parsePositiveKg } from "@/lib/stock";
import { buatStokAwal, tambahStok } from "@/app/admin/actions";

type Mode = "awal" | "masuk";

export function StokForm({ stok }: { stok: StokTahunan[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("awal");
  const [jenis, setJenis] = useState<JenisPupuk>("Urea");
  const [kg, setKg] = useState("");
  const [sumber, setSumber] = useState("");
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, start] = useTransition();
  const pilihan = stok.find((s) => s.jenis === jenis);

  function submit() {
    setErr("");
    setSuccess("");
    const jumlah = parsePositiveKg(kg);
    if (jumlah == null) return setErr("Jumlah harus berupa bilangan bulat positif.");
    if (mode === "awal" && pilihan?.ada) return setErr(`Stok awal ${jenis} sudah dibuat tahun ini.`);
    if (mode === "masuk" && !pilihan?.ada) return setErr(`Buat stok awal ${jenis} terlebih dahulu.`);

    start(async () => {
      const res = mode === "awal"
        ? await buatStokAwal(jenis, jumlah, sumber, catatan)
        : await tambahStok(jenis, jumlah, sumber, catatan);
      if (!res.ok) return setErr(res.error || "Gagal menyimpan stok.");
      setKg("");
      setCatatan("");
      setSuccess(mode === "awal" ? `Stok awal ${jenis} berhasil dibuat.` : `Stok ${jenis} berhasil ditambahkan.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <PackagePlus size={17} className="text-harvest-500" />
        <div>
          <h2 className="font-display text-lg font-600 text-pine-800">Kelola stok</h2>
          <p className="text-xs text-pine-400">Saldo selalu ditambah dan tercatat sebagai penerimaan.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-pine-50 p-1">
        <button type="button" onClick={() => { setMode("awal"); setErr(""); }} className={`rounded-lg px-3 py-2 text-xs font-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-300 ${mode === "awal" ? "bg-white text-pine-700 shadow-sm" : "text-pine-400 hover:text-pine-600"}`}>
          Buat stok awal
        </button>
        <button type="button" onClick={() => { setMode("masuk"); setErr(""); }} className={`rounded-lg px-3 py-2 text-xs font-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-300 ${mode === "masuk" ? "bg-white text-pine-700 shadow-sm" : "text-pine-400 hover:text-pine-600"}`}>
          Tambah stok masuk
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-600 text-pine-600">Jenis pupuk</label>
          <select value={jenis} onChange={(e) => { setJenis(e.target.value as JenisPupuk); setErr(""); }} className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400">
            {JENIS_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-600 text-pine-600">Jumlah (kg)</label>
          <input value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0" className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 font-mono text-sm text-pine-800 outline-none focus:border-pine-400" />
        </div>
        <div>
          <label className="text-xs font-600 text-pine-600">Sumber / pemasok</label>
          <input value={sumber} onChange={(e) => setSumber(e.target.value)} placeholder={mode === "awal" ? "Gudang pemerintah" : "Nama pemasok / gudang asal"} className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400" />
        </div>
        <div>
          <label className="text-xs font-600 text-pine-600">Catatan <span className="font-400 text-pine-400">(opsional)</span></label>
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Nomor surat jalan, tanggal kirim, atau keterangan lain" className="mt-1.5 w-full resize-none rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400" />
        </div>
      </div>

      {err && <p className="mt-3 flex items-center gap-1.5 text-sm text-clay"><AlertCircle size={14} />{err}</p>}
      {success && <p className="mt-3 flex items-center gap-1.5 text-sm text-pine-600"><Check size={14} />{success}</p>}
      <button type="button" onClick={submit} disabled={pending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-600 text-paper transition hover:bg-pine-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-300 disabled:opacity-50">
        <PackagePlus size={16} /> {pending ? "Menyimpan…" : mode === "awal" ? "Buat Stok Awal" : "Tambah Stok"}
      </button>
    </section>
  );
}
