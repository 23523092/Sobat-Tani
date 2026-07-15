import { Boxes, PackagePlus, Truck } from "lucide-react";
import { getPenerimaanStok, getStokTahunan } from "@/lib/queries";
import { tahunAktif } from "@/lib/stock";
import { StokForm } from "./StokForm";

export const dynamic = "force-dynamic";

function kg(n: number) {
  return `${n.toLocaleString("id-ID")} kg`;
}

function tanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StokPage() {
  const tahun = tahunAktif();
  const [stok, penerimaan] = await Promise.all([getStokTahunan(tahun), getPenerimaanStok(tahun)]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Persediaan KPL</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Stok Pupuk {tahun}</h1>
        <p className="mt-1.5 text-sm text-pine-500">
          Catat stok awal dan setiap penerimaan agar saldo fisik KPL tidak tercampur dengan kuota petani.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stok.map((s) => (
          <div key={s.jenis} className="rounded-2xl border border-pine-100 bg-white/70 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-50 text-pine-600">
                <Boxes size={19} />
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${s.ada ? "bg-pine-50 text-pine-600" : "bg-harvest-100 text-harvest-600"}`}>
                {s.ada ? "Aktif" : "Belum dibuat"}
              </span>
            </div>
            <div className="mt-4 text-sm font-600 text-pine-700">{s.jenis}</div>
            <div className="mt-1 font-display text-2xl font-600 text-pine-800">{kg(s.stokTersediaKg)}</div>
            <div className="mt-1 text-xs text-pine-400">tersedia di KPL</div>
            <div className="mt-4 space-y-1 border-t border-dashed border-pine-100 pt-3 text-xs text-pine-500">
              <div className="flex justify-between"><span>Stok awal</span><span className="font-mono">{kg(s.stokAwalKg)}</span></div>
              <div className="flex justify-between"><span>Stok masuk</span><span className="font-mono">{kg(s.masukKg)}</span></div>
              <div className="flex justify-between"><span>Sudah ditebus</span><span className="font-mono">{kg(s.keluarKg)}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <StokForm stok={stok} />

        <section className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Truck size={17} className="text-harvest-500" />
            <div>
              <h2 className="font-display text-lg font-600 text-pine-800">Penerimaan terbaru</h2>
              <p className="text-xs text-pine-400">Audit stok masuk tahun {tahun}</p>
            </div>
          </div>
          {penerimaan.length === 0 ? (
            <p className="py-10 text-center text-sm text-pine-400">Belum ada stok yang dicatat.</p>
          ) : (
            <ul className="space-y-3">
              {penerimaan.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 border-b border-dashed border-pine-100 pb-3 last:border-0">
                  <div>
                    <div className="text-sm font-600 text-pine-800">{p.jenis} · {kg(p.jumlahKg)}</div>
                    <div className="mt-0.5 text-xs text-pine-400">{p.sumber} · {tanggal(p.tanggal)}</div>
                    {p.catatan && <div className="mt-1 text-xs text-pine-500">{p.catatan}</div>}
                  </div>
                  <PackagePlus size={16} className="mt-0.5 shrink-0 text-pine-300" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
