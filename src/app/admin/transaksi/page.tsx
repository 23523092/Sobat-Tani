import { formatRupiah } from "@/lib/data";
import { getTransaksi } from "@/lib/queries";
import { tahunAktif } from "@/lib/stock";
import { TransaksiFilter } from "./TransaksiFilter";

export const dynamic = "force-dynamic";

function tgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const angkaTahun = Number(params.tahun);
  const tahun = Number.isInteger(angkaTahun) && angkaTahun >= 2000 && angkaTahun <= 2100 ? angkaTahun : undefined;
  const transaksi = await getTransaksi(tahun);
  const aktif = tahunAktif();
  const total = transaksi.reduce((a, t) => a + t.total, 0);
  const totalKg = transaksi.reduce((a, t) => a + t.jumlahKg, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Audit Trail</span>
          <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Riwayat Penebusan</h1>
          <p className="mt-1.5 text-sm text-pine-500">Tercatat otomatis · timestamp, kios, dan tahun penyaluran</p>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <TransaksiFilter tahun={tahun} tahunAktif={aktif} />
          <div>
            <div className="font-display text-xl font-600 text-pine-800">{totalKg.toLocaleString("id-ID")} kg</div>
            <div className="text-xs text-pine-400">Total volume</div>
          </div>
          <div>
            <div className="font-display text-xl font-600 text-pine-800">{formatRupiah(total)}</div>
            <div className="text-xs text-pine-400">Total nilai</div>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-pine-100 bg-white/70 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 bg-pine-50/60 text-xs uppercase tracking-wide text-pine-500">
                <th className="px-5 py-3 font-600">ID</th>
                <th className="px-5 py-3 font-600">Petani</th>
                <th className="px-5 py-3 font-600">Pupuk</th>
                <th className="px-5 py-3 font-600">Tahun</th>
                <th className="px-5 py-3 font-600">Kios</th>
                <th className="px-5 py-3 font-600">Waktu</th>
                <th className="px-5 py-3 text-right font-600">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-pine-400">
                    Belum ada transaksi penebusan.
                  </td>
                </tr>
              ) : (
                [...transaksi].reverse().map((t) => (
                  <tr key={t.id} className="border-b border-pine-50 transition last:border-0 hover:bg-sage/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-pine-500">{t.id}</td>
                    <td className="px-5 py-3.5 font-600 text-pine-800">{t.nama}</td>
                    <td className="px-5 py-3.5 text-pine-600">
                      <span className="font-mono text-xs">{t.jumlahKg} kg</span> {t.jenis}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-pine-500">{t.tahun}</td>
                    <td className="px-5 py-3.5 text-pine-600">{t.kios}</td>
                    <td className="px-5 py-3.5 text-xs text-pine-400">{tgl(t.tanggal)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-pine-700">{formatRupiah(t.total)}</td>
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
