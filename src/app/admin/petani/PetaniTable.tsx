"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { totalSisa, type Petani, type StatusPetani } from "@/lib/data";
import { ubahStatusPetani } from "@/app/admin/actions";

const FILTERS: (StatusPetani | "Semua")[] = ["Semua", "Terdaftar", "Pending", "Ditolak"];

const STATUS_STYLE: Record<StatusPetani, string> = {
  Terdaftar: "bg-pine-700 text-harvest-200",
  Pending: "bg-harvest-100 text-harvest-600",
  Ditolak: "bg-clay/10 text-clay",
};

export function PetaniTable({ petani }: { petani: Petani[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(StatusPetani | "Semua")>("Semua");
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const rows = useMemo(() => {
    const key = q.toLowerCase().trim();
    return petani.filter((p) => {
      if (filter !== "Semua" && p.status !== filter) return false;
      if (!key) return true;
      return (
        p.nama.toLowerCase().includes(key) ||
        p.nik.includes(key) ||
        p.desa.toLowerCase().includes(key) ||
        p.kelompokTani.toLowerCase().includes(key)
      );
    });
  }, [petani, q, filter]);

  function ubah(nik: string, status: StatusPetani) {
    setBusy(nik);
    start(async () => {
      await ubahStatusPetani(nik, status);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div>
      {/* kontrol */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pine-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, NIK, desa, kelompok…"
            className="w-full rounded-xl border border-pine-200 bg-white/70 py-2.5 pl-9 pr-3 text-sm text-pine-800 outline-none focus:border-pine-400"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-600 transition ${
                filter === f
                  ? "bg-pine-700 text-paper"
                  : "border border-pine-200 text-pine-600 hover:bg-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-pine-100 bg-white/70 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 bg-pine-50/60 text-xs uppercase tracking-wide text-pine-500">
                <th className="px-5 py-3 font-600">Petani</th>
                <th className="px-5 py-3 font-600">NIK</th>
                <th className="px-5 py-3 font-600">Lahan</th>
                <th className="px-5 py-3 font-600">Sisa kuota</th>
                <th className="px-5 py-3 font-600">Status / Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-pine-400">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.nik} className="border-b border-pine-50 transition last:border-0 hover:bg-sage/40">
                    <td className="px-5 py-3.5">
                      <div className="font-600 text-pine-800">{p.nama}</div>
                      <div className="text-xs text-pine-400">{p.kelompokTani} · {p.desa}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-pine-600">{p.nik}</td>
                    <td className="px-5 py-3.5 text-pine-600">
                      <div>{p.luasLahanHa} ha</div>
                      <div className="text-xs text-pine-400">{p.komoditas}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.alokasi.length ? (
                        <div className="flex flex-wrap gap-1">
                          {p.alokasi.map((a) => (
                            <span
                              key={a.jenis}
                              className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                                a.sisaKg === 0 ? "bg-clay/10 text-clay" : "bg-pine-50 text-pine-600"
                              }`}
                              title={`${a.jenis}: sisa ${a.sisaKg}/${a.kuotaKg} kg`}
                            >
                              {a.jenis[0]}:{a.sisaKg}
                            </span>
                          ))}
                          <span className="ml-1 self-center text-xs text-pine-400">Σ {totalSisa(p)} kg</span>
                        </div>
                      ) : (
                        <span className="text-xs text-pine-300">Belum ada</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-600 ${STATUS_STYLE[p.status]}`}>
                          {p.status}
                        </span>
                        <select
                          value={p.status}
                          disabled={busy === p.nik}
                          onChange={(e) => ubah(p.nik, e.target.value as StatusPetani)}
                          className="rounded-lg border border-pine-200 bg-white px-2 py-1 text-xs text-pine-600 outline-none focus:border-pine-400 disabled:opacity-50"
                          title="Ubah status"
                        >
                          <option value="Terdaftar">Terdaftar</option>
                          <option value="Pending">Pending</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
