"use client";

import { useRouter } from "next/navigation";

export function TransaksiFilter({ tahun, tahunAktif }: { tahun?: number; tahunAktif: number }) {
  const router = useRouter();
  const opsi = Array.from({ length: 5 }, (_, i) => tahunAktif - i);

  return (
    <label className="flex items-center gap-2 text-xs font-600 text-pine-500">
      Tahun
      <select
        value={tahun ?? "semua"}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value === "semua" ? "/admin/transaksi" : `/admin/transaksi?tahun=${value}`);
        }}
        className="rounded-lg border border-pine-200 bg-white px-2.5 py-2 text-sm font-500 text-pine-700 outline-none transition focus:border-pine-400 focus:ring-2 focus:ring-pine-100"
      >
        <option value="semua">Semua tahun</option>
        {opsi.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}
