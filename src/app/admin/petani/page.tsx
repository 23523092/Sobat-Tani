import { PETANI, totalSisa } from "@/lib/data";

export default function PetaniPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Basis Data</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Data Petani</h1>
        <p className="mt-1.5 text-sm text-pine-500">{PETANI.length} petani terdaftar pada e-RDKK · data demo</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-pine-100 bg-white/70 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 bg-pine-50/60 text-xs uppercase tracking-wide text-pine-500">
                <th className="px-5 py-3 font-600">Petani</th>
                <th className="px-5 py-3 font-600">NIK</th>
                <th className="px-5 py-3 font-600">Lahan</th>
                <th className="px-5 py-3 font-600">Sisa kuota</th>
                <th className="px-5 py-3 font-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {PETANI.map((p) => (
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
                              a.sisaKg === 0
                                ? "bg-clay/10 text-clay"
                                : "bg-pine-50 text-pine-600"
                            }`}
                            title={`${a.jenis}: sisa ${a.sisaKg}/${a.kuotaKg} kg`}
                          >
                            {a.jenis[0]}:{a.sisaKg}
                          </span>
                        ))}
                        <span className="ml-1 self-center text-xs text-pine-400">Σ {totalSisa(p)} kg</span>
                      </div>
                    ) : (
                      <span className="text-xs text-pine-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-600 ${
                        p.status === "Terdaftar"
                          ? "bg-pine-700 text-harvest-200"
                          : "bg-harvest-100 text-harvest-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
