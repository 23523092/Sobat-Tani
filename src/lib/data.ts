// ============================================================================
// TIPE & HELPER MURNI — Kios Tani Digital
// Tidak ada data di sini. Semua data diambil dari Supabase (lihat queries.ts).
// File ini hanya berisi definisi tipe dan fungsi bantu tanpa efek samping.
// ============================================================================

export type JenisPupuk = "Urea" | "NPK" | "Organik";
export type StatusPetani = "Pending" | "Terdaftar" | "Ditolak";

export const JENIS_LIST: JenisPupuk[] = ["Urea", "NPK", "Organik"];
export const URUTAN_JENIS: Record<JenisPupuk, number> = { Urea: 0, NPK: 1, Organik: 2 };

export interface Alokasi {
  tahun: number;
  jenis: JenisPupuk;
  kuotaKg: number; // jatah total musim tanam
  sisaKg: number; // sisa yang bisa ditebus
}

export interface Petani {
  nik: string; // 16 digit
  noTelp: string;
  nama: string;
  kelompokTani: string;
  desa: string;
  kecamatan: string;
  luasLahanHa: number;
  komoditas: string;
  status: StatusPetani;
  catatan?: string | null; // alasan tolak / catatan petugas
  alokasi: Alokasi[];
}

export interface Transaksi {
  id: string;
  tahun: number;
  nik: string;
  nama: string;
  jenis: JenisPupuk;
  jumlahKg: number;
  total: number;
  kios: string;
  tanggal: string; // ISO
}

export interface StokTahunan {
  tahun: number;
  jenis: JenisPupuk;
  stokAwalKg: number;
  stokTersediaKg: number;
  masukKg: number;
  keluarKg: number;
  persentaseTerserap: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PenerimaanStok {
  id: string;
  tahun: number;
  jenis: JenisPupuk;
  jumlahKg: number;
  sumber: string;
  catatan?: string | null;
  tanggal: string;
}

export type HETMap = Record<JenisPupuk, number>;

export interface Edukasi {
  syaratSubsidi: string[];
  caraTebus: string[];
  tips: string[];
  dosisAnjuran: Record<string, string>;
  het: HETMap;
}

// ── Helper murni ────────────────────────────────────────────────────────────

export function totalSisa(p: Petani): number {
  return p.alokasi.reduce((a, b) => a + b.sisaKg, 0);
}

export function totalKuotaPetani(p: Petani): number {
  return p.alokasi.reduce((a, b) => a + b.kuotaKg, 0);
}

export function formatRupiah(n: number): string {
  if (!Number.isFinite(n)) return "Rp 0";
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

/**
 * Saran alokasi kuota otomatis berdasarkan luas lahan (kg per musim).
 * Dipakai petugas saat menyetujui pendaftar — angka bisa disesuaikan manual.
 * Basis: Urea 200 kg/ha, NPK 150 kg/ha, Organik 250 kg/ha (dibulatkan ke 5 kg).
 */
export function saranAlokasi(luasHa: number, tahun: number): Alokasi[] {
  const bulat = (x: number) => Math.max(0, Math.round(x / 5) * 5);
  const basis: Record<JenisPupuk, number> = { Urea: 200, NPK: 150, Organik: 250 };
  return JENIS_LIST.map((jenis) => {
    const kg = bulat(luasHa * basis[jenis]);
    return { tahun, jenis, kuotaKg: kg, sisaKg: kg };
  });
}
