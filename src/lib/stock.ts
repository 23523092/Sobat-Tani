export function parsePositiveKg(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const kg = Number(value);
  return Number.isSafeInteger(kg) && kg > 0 ? kg : null;
}

export function isValidJenisPupuk(value: string): value is "Urea" | "NPK" | "Organik" {
  return value === "Urea" || value === "NPK" || value === "Organik";
}

export interface StockSummary {
  stokAwalKg: number;
  masukKg: number;
  keluarKg: number;
  tersediaKg: number;
  persentaseTerserap: number;
}

export function tahunAktif(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
    }).format(new Date())
  );
}

export function summarizeStok(
  stokAwalKg: number,
  masukKg: number,
  keluarKg: number,
  tersediaKg: number
): StockSummary {
  const totalMasuk = Math.max(0, stokAwalKg) + Math.max(0, masukKg);
  const persentaseTerserap = totalMasuk > 0
    ? Math.min(100, Math.max(0, Math.round((Math.max(0, keluarKg) / totalMasuk) * 100)))
    : 0;
  return {
    stokAwalKg: Math.max(0, stokAwalKg),
    masukKg: Math.max(0, masukKg),
    keluarKg: Math.max(0, keluarKg),
    tersediaKg: Math.max(0, tersediaKg),
    persentaseTerserap,
  };
}
