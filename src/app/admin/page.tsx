import { formatRupiah, type JenisPupuk } from "@/lib/data";
import { getHET, getPetaniList, getStokTahunan, getTransaksi, statistikGlobal } from "@/lib/queries";
import { tahunAktif } from "@/lib/stock";
import { Users, PackageCheck, Boxes, Wallet, TrendingUp, Clock, Warehouse } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const tahun = tahunAktif();
  const [s, petani, transaksi, het, stokFisik] = await Promise.all([
    statistikGlobal(),
    getPetaniList(),
    getTransaksi(tahun),
    getHET(),
    getStokTahunan(tahun),
  ]);

  // agregasi stok per jenis
  const jenisList: JenisPupuk[] = ["Urea", "NPK", "Organik"];
  const penyerapan = jenisList.map((j) => {
    let kuota = 0,
      sisa = 0;
    petani.forEach((p) =>
      p.alokasi
        .filter((a) => a.jenis === j)
        .forEach((a) => {
          kuota += a.kuotaKg;
          sisa += a.sisaKg;
        })
    );
    return { jenis: j, kuota, sisa, tertebus: kuota - sisa };
  });

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const cards = [
    { icon: Users, label: "Petani terdaftar", value: `${s.terdaftar}/${s.totalPetani}`, sub: "status aktif e-RDKK" },
    { icon: Boxes, label: "Total alokasi", value: `${(s.totalKuota / 1000).toFixed(1)} ton`, sub: "musim tanam berjalan" },
    { icon: PackageCheck, label: "Sudah ditebus", value: `${(s.tertebus / 1000).toFixed(1)} ton`, sub: `${pct(s.tertebus, s.totalKuota)}% dari alokasi` },
    { icon: Warehouse, label: "Stok KPL tersedia", value: `${(stokFisik.reduce((a, b) => a + b.stokTersediaKg, 0) / 1000).toFixed(1)} ton`, sub: `stok fisik tahun ${tahun}` },
    { icon: Wallet, label: "Nilai transaksi", value: formatRupiah(s.nilaiTransaksi), sub: `${s.jumlahTransaksi} penebusan` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-8">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Panel Petugas</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Dashboard Penyerapan</h1>
        <p className="mt-1.5 text-sm text-pine-500">Pemantauan penyaluran pupuk subsidi · KPL wilayah binaan</p>
      </header>

      {/* Banner pendaftar menunggu */}
      {s.pending > 0 && (
        <Link
          href="/admin/pendaftar"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-harvest-200 bg-harvest-100 px-5 py-3.5 shadow-card transition hover:bg-harvest-200"
        >
          <span className="flex items-center gap-2.5 text-sm font-600 text-harvest-600">
            <Clock size={17} />
            {s.pending} pendaftar menunggu verifikasi
          </span>
          <span className="text-xs font-600 text-harvest-600">Tinjau →</span>
        </Link>
      )}

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-pine-100 bg-white/70 p-5 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-50 text-pine-600">
              <c.icon size={19} />
            </span>
            <div className="mt-3.5 font-display text-2xl font-600 leading-none text-pine-800">{c.value}</div>
            <div className="mt-1.5 text-sm font-500 text-pine-700">{c.label}</div>
            <div className="text-xs text-pine-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* stok per jenis */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp size={17} className="text-harvest-500" />
            <h2 className="font-display text-lg font-600 text-pine-800">Penyerapan per jenis pupuk</h2>
          </div>
          {penyerapan.every((st) => st.kuota === 0) ? (
            <p className="py-8 text-center text-sm text-pine-400">Belum ada alokasi tercatat.</p>
          ) : (
            <div className="space-y-5">
              {penyerapan.map((st) => {
                const p = pct(st.tertebus, st.kuota);
                const fisik = stokFisik.find((x) => x.jenis === st.jenis);
                return (
                  <div key={st.jenis}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-600 text-pine-700">{st.jenis}</span>
                      <span className="font-mono text-xs text-pine-500">
                        {st.tertebus} / {st.kuota} kg · {p}% kuota
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-sage">
                      <div className="h-full rounded-full bg-pine-600" style={{ width: `${p}%` }} />
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-pine-400">
                      HET {het[st.jenis] != null ? formatRupiah(het[st.jenis]) : "-"}/kg · sisa kuota {st.sisa} kg · stok KPL {fisik?.stokTersediaKg ?? 0} kg
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* transaksi terbaru */}
        <div className="rounded-2xl border border-pine-100 bg-white/70 p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-600 text-pine-800">Penebusan terbaru</h2>
          {transaksi.length === 0 ? (
            <p className="py-8 text-center text-sm text-pine-400">Belum ada penebusan.</p>
          ) : (
            <ul className="space-y-3.5">
              {[...transaksi].reverse().slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-b border-dashed border-pine-100 pb-3 last:border-0">
                  <div>
                    <div className="text-sm font-600 text-pine-800">{t.nama}</div>
                    <div className="text-xs text-pine-400">
                      {t.jumlahKg} kg {t.jenis} · {t.kios}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-500 text-pine-600">{formatRupiah(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
