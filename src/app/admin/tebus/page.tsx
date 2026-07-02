"use client";

import { useMemo, useState } from "react";
import { PETANI, HET, formatRupiah, type JenisPupuk, type Petani } from "@/lib/data";
import { Check, AlertCircle, Receipt } from "lucide-react";

interface Trx { id: string; nama: string; jenis: JenisPupuk; kg: number; total: number; waktu: string }

export default function TebusPage() {
  const [data, setData] = useState<Petani[]>(() => JSON.parse(JSON.stringify(PETANI)));
  const [nik, setNik] = useState("");
  const [jenis, setJenis] = useState<JenisPupuk>("Urea");
  const [kg, setKg] = useState("");
  const [log, setLog] = useState<Trx[]>([]);
  const [err, setErr] = useState("");

  const petani = useMemo(() => data.find((p) => p.nik === nik) ?? null, [data, nik]);
  const alok = petani?.alokasi.find((a) => a.jenis === jenis) ?? null;
  const terdaftar = data.filter((p) => p.status === "Terdaftar");

  function tebus() {
    setErr("");
    const n = parseInt(kg, 10);
    if (!petani) return setErr("Pilih petani dulu.");
    if (!alok) return setErr(`Petani ini tidak punya alokasi ${jenis}.`);
    if (!n || n <= 0) return setErr("Jumlah kg tidak valid.");
    if (n > alok.sisaKg) return setErr(`Melebihi sisa kuota. Sisa ${jenis}: ${alok.sisaKg} kg.`);

    setData((prev) =>
      prev.map((p) =>
        p.nik !== petani.nik ? p : { ...p, alokasi: p.alokasi.map((a) => (a.jenis === jenis ? { ...a, sisaKg: a.sisaKg - n } : a)) }
      )
    );
    const total = n * HET[jenis];
    setLog((l) => [
      { id: "TRX-" + Math.random().toString(36).slice(2, 7).toUpperCase(), nama: petani.nama, jenis, kg: n, total, waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
      ...l,
    ]);
    setKg("");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Loket Kios</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Catat Penebusan</h1>
        <p className="mt-1.5 text-sm text-pine-500">Petugas mencatat penebusan—stok kuota berkurang otomatis.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* FORM */}
        <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
          <label className="text-xs font-600 text-pine-600">Petani</label>
          <select value={nik} onChange={(e) => { setNik(e.target.value); setErr(""); }}
            className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400">
            <option value="">— pilih petani —</option>
            {terdaftar.map((p) => <option key={p.nik} value={p.nik}>{p.nama} · {p.kelompokTani}</option>)}
          </select>

          {petani && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {petani.alokasi.map((a) => (
                <div key={a.jenis} className={`rounded-xl border p-2.5 text-center ${a.jenis === jenis ? "border-pine-400 bg-pine-50" : "border-pine-100"}`}>
                  <div className="text-[11px] text-pine-500">{a.jenis}</div>
                  <div className="font-mono text-sm font-600 text-pine-800">{a.sisaKg}<span className="text-pine-400">kg</span></div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-600 text-pine-600">Jenis</label>
              <select value={jenis} onChange={(e) => setJenis(e.target.value as JenisPupuk)}
                className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400">
                {(["Urea", "NPK", "Organik"] as JenisPupuk[]).map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-600 text-pine-600">Jumlah (kg)</label>
              <input value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0"
                className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 font-mono text-sm text-pine-800 outline-none focus:border-pine-400" />
            </div>
          </div>

          {kg && alok && (
            <p className="mt-2.5 text-sm text-pine-600">Total: <span className="font-mono font-600 text-pine-800">{formatRupiah((parseInt(kg, 10) || 0) * HET[jenis])}</span></p>
          )}
          {err && <p className="mt-2.5 flex items-center gap-1.5 text-sm text-clay"><AlertCircle size={14} />{err}</p>}

          <button onClick={tebus} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-600 text-paper transition hover:bg-pine-800">
            <Check size={16} /> Catat Penebusan
          </button>
        </div>

        {/* LOG */}
        <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2"><Receipt size={17} className="text-harvest-500" /><h2 className="font-display text-lg font-600 text-pine-800">Penebusan sesi ini</h2></div>
          {log.length === 0 ? (
            <p className="py-10 text-center text-sm text-pine-400">Belum ada penebusan. Catat lewat form di samping.</p>
          ) : (
            <ul className="space-y-3">
              {log.map((t) => (
                <li key={t.id} className="flex items-center justify-between border-b border-dashed border-pine-100 pb-3 last:border-0">
                  <div>
                    <div className="text-sm font-600 text-pine-800">{t.nama}</div>
                    <div className="text-xs text-pine-400">{t.kg} kg {t.jenis} · {t.waktu} · <span className="font-mono">{t.id}</span></div>
                  </div>
                  <span className="font-mono text-xs font-600 text-pine-600">{formatRupiah(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
