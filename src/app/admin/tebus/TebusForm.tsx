"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Receipt } from "lucide-react";
import { JENIS_LIST, formatRupiah, type HETMap, type JenisPupuk, type Petani } from "@/lib/data";
import { catatTebus } from "@/app/admin/actions";

interface Trx {
  id: string;
  nama: string;
  jenis: JenisPupuk;
  kg: number;
  total: number;
  waktu: string;
}

export function TebusForm({ petani, het }: { petani: Petani[]; het: HETMap }) {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [jenis, setJenis] = useState<JenisPupuk>("Urea");
  const [kg, setKg] = useState("");
  const [kios, setKios] = useState("");
  const [log, setLog] = useState<Trx[]>([]);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const dipilih = useMemo(() => petani.find((p) => p.nik === nik) ?? null, [petani, nik]);
  const alok = dipilih?.alokasi.find((a) => a.jenis === jenis) ?? null;
  const harga = het[jenis] ?? 0;

  // Prefill nama kios dari desa petani
  useEffect(() => {
    if (dipilih) setKios((k) => k || `KPL ${dipilih.desa}`);
  }, [dipilih]);

  function tebus() {
    setErr("");
    const n = parseInt(kg, 10);
    if (!dipilih) return setErr("Pilih petani dulu.");
    if (!alok) return setErr(`Petani ini tidak punya alokasi ${jenis}.`);
    if (!n || n <= 0) return setErr("Jumlah kg tidak valid.");
    if (n > alok.sisaKg) return setErr(`Melebihi sisa kuota. Sisa ${jenis}: ${alok.sisaKg} kg.`);

    start(async () => {
      const res = await catatTebus(dipilih.nik, jenis, n, kios);
      if (!res.ok) return setErr(res.error || "Gagal mencatat.");
      setLog((l) => [
        {
          id: res.transaksiId || "TRX",
          nama: dipilih.nama,
          jenis,
          kg: n,
          total: n * harga,
          waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        ...l,
      ]);
      setKg("");
      router.refresh(); // muat ulang sisa kuota dari DB
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* FORM */}
      <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
        {petani.length === 0 ? (
          <p className="py-10 text-center text-sm text-pine-400">
            Belum ada petani berstatus Terdaftar. Setujui pendaftar dulu di menu Verifikasi.
          </p>
        ) : (
          <>
            <label className="text-xs font-600 text-pine-600">Petani</label>
            <select
              value={nik}
              onChange={(e) => {
                setNik(e.target.value);
                setErr("");
                setKios("");
              }}
              className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
            >
              <option value="">Pilih petani</option>
              {petani.map((p) => (
                <option key={p.nik} value={p.nik}>
                  {p.nama} · {p.kelompokTani}
                </option>
              ))}
            </select>

            {dipilih && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {dipilih.alokasi.map((a) => (
                  <button
                    key={a.jenis}
                    type="button"
                    onClick={() => setJenis(a.jenis)}
                    className={`rounded-xl border p-2.5 text-center transition ${
                      a.jenis === jenis ? "border-pine-400 bg-pine-50" : "border-pine-100 hover:border-pine-200"
                    }`}
                  >
                    <div className="text-[11px] text-pine-500">{a.jenis}</div>
                    <div className="font-mono text-sm font-600 text-pine-800">
                      {a.sisaKg}
                      <span className="text-pine-400">kg</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-600 text-pine-600">Jenis</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as JenisPupuk)}
                  className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
                >
                  {JENIS_LIST.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-600 text-pine-600">Jumlah (kg)</label>
                <input
                  value={kg}
                  onChange={(e) => setKg(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="0"
                  className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 font-mono text-sm text-pine-800 outline-none focus:border-pine-400"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-600 text-pine-600">Kios (KPL)</label>
              <input
                value={kios}
                onChange={(e) => setKios(e.target.value)}
                placeholder="KPL …"
                className="mt-1.5 w-full rounded-xl border border-pine-200 bg-white px-3 py-2.5 text-sm text-pine-800 outline-none focus:border-pine-400"
              />
            </div>

            {kg && alok && (
              <p className="mt-2.5 text-sm text-pine-600">
                Total:{" "}
                <span className="font-mono font-600 text-pine-800">
                  {formatRupiah((parseInt(kg, 10) || 0) * harga)}
                </span>
              </p>
            )}
            {err && (
              <p className="mt-2.5 flex items-center gap-1.5 text-sm text-clay">
                <AlertCircle size={14} />
                {err}
              </p>
            )}

            <button
              onClick={tebus}
              disabled={pending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-600 text-paper transition hover:bg-pine-800 disabled:opacity-50"
            >
              <Check size={16} /> {pending ? "Menyimpan…" : "Catat Penebusan"}
            </button>
          </>
        )}
      </div>

      {/* LOG */}
      <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Receipt size={17} className="text-harvest-500" />
          <h2 className="font-display text-lg font-600 text-pine-800">Penebusan sesi ini</h2>
        </div>
        {log.length === 0 ? (
          <p className="py-10 text-center text-sm text-pine-400">Belum ada penebusan. Catat lewat form di samping.</p>
        ) : (
          <ul className="space-y-3">
            {log.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-dashed border-pine-100 pb-3 last:border-0">
                <div>
                  <div className="text-sm font-600 text-pine-800">{t.nama}</div>
                  <div className="text-xs text-pine-400">
                    {t.kg} kg {t.jenis} · {t.waktu} · <span className="font-mono">{t.id}</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-600 text-pine-600">{formatRupiah(t.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
