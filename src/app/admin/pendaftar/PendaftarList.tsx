"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  MapPin,
  Phone,
  Sprout,
  Ruler,
  AlertCircle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import {
  JENIS_LIST,
  saranAlokasi,
  type JenisPupuk,
  type Petani,
} from "@/lib/data";
import { tahunAktif } from "@/lib/stock";
import { setujuiPendaftar, tolakPendaftar, ubahStatusPetani } from "@/app/admin/actions";

type Mode = { nik: string; jenis: "approve" | "reject" } | null;
type KuotaState = Record<JenisPupuk, string>;

export function PendaftarList({
  pending,
  ditolak,
}: {
  pending: Petani[];
  ditolak: Petani[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [kuota, setKuota] = useState<KuotaState>({ Urea: "", NPK: "", Organik: "" });
  const [alasan, setAlasan] = useState("");
  const [err, setErr] = useState("");
  const [pending_, start] = useTransition();
  const [showDitolak, setShowDitolak] = useState(false);

  function bukaApprove(p: Petani) {
    setErr("");
    const saran = saranAlokasi(p.luasLahanHa, tahunAktif());
    const k: KuotaState = { Urea: "", NPK: "", Organik: "" };
    saran.forEach((a) => (k[a.jenis] = String(a.kuotaKg)));
    setKuota(k);
    setMode({ nik: p.nik, jenis: "approve" });
  }

  function bukaReject(p: Petani) {
    setErr("");
    setAlasan("");
    setMode({ nik: p.nik, jenis: "reject" });
  }

  function tutup() {
    setMode(null);
    setErr("");
  }

  function submitApprove(p: Petani) {
    setErr("");
    const alokasi = JENIS_LIST.map((j) => ({ jenis: j, kuotaKg: parseInt(kuota[j] || "0", 10) })).filter(
      (a) => a.kuotaKg > 0
    );
    if (alokasi.length === 0) return setErr("Isi minimal satu alokasi pupuk.");
    start(async () => {
      const res = await setujuiPendaftar(p.nik, alokasi);
      if (!res.ok) return setErr(res.error || "Gagal menyetujui.");
      tutup();
      router.refresh();
    });
  }

  function submitReject(p: Petani) {
    setErr("");
    start(async () => {
      const res = await tolakPendaftar(p.nik, alasan);
      if (!res.ok) return setErr(res.error || "Gagal menolak.");
      tutup();
      router.refresh();
    });
  }

  function kembalikanPending(nik: string) {
    start(async () => {
      const res = await ubahStatusPetani(nik, "Pending");
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-pine-200 bg-white/50 py-14 text-center">
          <Check size={26} className="mx-auto text-pine-300" />
          <p className="mt-2 text-sm text-pine-500">Tidak ada pendaftar yang menunggu verifikasi.</p>
        </div>
      ) : (
        pending.map((p) => {
          const aktif = mode?.nik === p.nik;
          return (
            <div
              key={p.nik}
              className="rounded-2xl border border-pine-100 bg-white/70 p-5 shadow-card transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-600 text-pine-800">{p.nama}</h3>
                    <span className="rounded-full bg-harvest-100 px-2.5 py-0.5 text-xs font-600 text-harvest-600">
                      Menunggu
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-pine-400">{p.nik}</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-pine-600 sm:grid-cols-2">
                    <span className="flex items-center gap-1.5"><Phone size={13} className="text-pine-400" />{p.noTelp}</span>
                    <span className="flex items-center gap-1.5"><Sprout size={13} className="text-pine-400" />{p.komoditas}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-pine-400" />{p.desa}, {p.kecamatan}</span>
                    <span className="flex items-center gap-1.5"><Ruler size={13} className="text-pine-400" />{p.luasLahanHa} ha · {p.kelompokTani}</span>
                  </div>
                </div>
                {!aktif && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => bukaReject(p)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-pine-200 px-3.5 py-2 text-sm font-600 text-clay transition hover:bg-clay/5"
                    >
                      <X size={15} /> Tolak
                    </button>
                    <button
                      onClick={() => bukaApprove(p)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-pine-700 px-3.5 py-2 text-sm font-600 text-paper transition hover:bg-pine-800"
                    >
                      <Check size={15} /> Setujui
                    </button>
                  </div>
                )}
              </div>

              {/* Panel Setujui */}
              {aktif && mode?.jenis === "approve" && (
                <div className="mt-4 rounded-xl border border-pine-100 bg-pine-50/50 p-4">
                  <p className="text-xs font-600 text-pine-600">
                    Tetapkan alokasi kuota (kg/musim), disarankan otomatis dari luas {p.luasLahanHa} ha:
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {JENIS_LIST.map((j) => (
                      <div key={j}>
                        <label className="text-[11px] font-600 text-pine-500">{j}</label>
                        <input
                          value={kuota[j]}
                          onChange={(e) =>
                            setKuota((k) => ({ ...k, [j]: e.target.value.replace(/\D/g, "") }))
                          }
                          inputMode="numeric"
                          className="mt-1 w-full rounded-lg border border-pine-200 bg-white px-2.5 py-2 font-mono text-sm text-pine-800 outline-none focus:border-pine-400"
                        />
                      </div>
                    ))}
                  </div>
                  {err && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm text-clay">
                      <AlertCircle size={14} /> {err}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={tutup} className="rounded-lg px-3.5 py-2 text-sm font-500 text-pine-500 hover:text-pine-700">
                      Batal
                    </button>
                    <button
                      onClick={() => submitApprove(p)}
                      disabled={pending_}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pine-700 px-4 py-2 text-sm font-600 text-paper transition hover:bg-pine-800 disabled:opacity-50"
                    >
                      <Check size={15} /> {pending_ ? "Menyimpan…" : "Setujui & Terbitkan Alokasi"}
                    </button>
                  </div>
                </div>
              )}

              {/* Panel Tolak */}
              {aktif && mode?.jenis === "reject" && (
                <div className="mt-4 rounded-xl border border-clay/20 bg-clay/5 p-4">
                  <label className="text-xs font-600 text-pine-600">Alasan penolakan (opsional)</label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={2}
                    placeholder="Mis. lahan melebihi 2 ha / data tidak sesuai e-RDKK"
                    className="mt-1.5 w-full resize-none rounded-lg border border-pine-200 bg-white px-3 py-2 text-sm text-pine-800 outline-none focus:border-pine-400"
                  />
                  {err && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm text-clay">
                      <AlertCircle size={14} /> {err}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={tutup} className="rounded-lg px-3.5 py-2 text-sm font-500 text-pine-500 hover:text-pine-700">
                      Batal
                    </button>
                    <button
                      onClick={() => submitReject(p)}
                      disabled={pending_}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-clay px-4 py-2 text-sm font-600 text-paper transition hover:opacity-90 disabled:opacity-50"
                    >
                      <X size={15} /> {pending_ ? "Menyimpan…" : "Tolak Pendaftar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Ditolak — dapat dikembalikan ke antrean */}
      {ditolak.length > 0 && (
        <div className="rounded-2xl border border-pine-100 bg-white/50 p-5 shadow-card">
          <button
            onClick={() => setShowDitolak((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-600 text-pine-700">
              Pendaftar ditolak ({ditolak.length})
            </span>
            <ChevronDown
              size={16}
              className={`text-pine-400 transition ${showDitolak ? "rotate-180" : ""}`}
            />
          </button>
          {showDitolak && (
            <ul className="mt-3 space-y-2.5">
              {ditolak.map((p) => (
                <li
                  key={p.nik}
                  className="flex items-center justify-between gap-3 border-t border-dashed border-pine-100 pt-2.5"
                >
                  <div>
                    <div className="text-sm font-600 text-pine-800">{p.nama}</div>
                    <div className="text-xs text-pine-400">
                      {p.catatan || "Ditolak"} · {p.desa}
                    </div>
                  </div>
                  <button
                    onClick={() => kembalikanPending(p.nik)}
                    disabled={pending_}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-pine-200 px-3 py-1.5 text-xs font-600 text-pine-600 transition hover:bg-pine-50 disabled:opacity-50"
                  >
                    <RotateCcw size={13} /> Tinjau ulang
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
