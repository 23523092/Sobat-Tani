// ============================================================================
// DATA DUMMY — Kios Tani Digital
// Semua data di sini fiktif untuk keperluan demo/prototipe.
// Untuk produksi, ganti file ini dengan query Supabase/PostgreSQL.
// HET & aturan mengacu skema pupuk subsidi Indonesia (e-RDKK / i-Pubers).
// ============================================================================

export type JenisPupuk = "Urea" | "NPK" | "Organik";

export interface Alokasi {
  jenis: JenisPupuk;
  kuotaKg: number; // jatah total musim tanam
  sisaKg: number; // sisa yang bisa ditebus
}

export interface Petani {
  nik: string; // 16 digit (dummy)
  noTelp: string;
  nama: string;
  kelompokTani: string;
  desa: string;
  kecamatan: string;
  luasLahanHa: number;
  komoditas: string;
  status: "Terdaftar" | "Pending";
  alokasi: Alokasi[];
}

export interface Transaksi {
  id: string;
  nik: string;
  nama: string;
  jenis: JenisPupuk;
  jumlahKg: number;
  total: number;
  kios: string;
  tanggal: string; // ISO
}

// Harga Eceran Tertinggi (HET) per kg — sesuai ketetapan subsidi
export const HET: Record<JenisPupuk, number> = {
  Urea: 2250,
  NPK: 2300,
  Organik: 800,
};

export const PETANI: Petani[] = [
  {
    nik: "1371042503780001",
    noTelp: "081267340012",
    nama: "Bujang Salim",
    kelompokTani: "Tani Saiyo",
    desa: "Koto Baru",
    kecamatan: "Lubuk Sikaping",
    luasLahanHa: 1.2,
    komoditas: "Padi",
    status: "Terdaftar",
    alokasi: [
      { jenis: "Urea", kuotaKg: 240, sisaKg: 140 },
      { jenis: "NPK", kuotaKg: 180, sisaKg: 180 },
      { jenis: "Organik", kuotaKg: 300, sisaKg: 120 },
    ],
  },
  {
    nik: "1371046612850002",
    noTelp: "081398220145",
    nama: "Siti Rohana",
    kelompokTani: "Bundo Kanduang",
    desa: "Sungai Tarab",
    kecamatan: "Sungai Tarab",
    luasLahanHa: 0.8,
    komoditas: "Jagung",
    status: "Terdaftar",
    alokasi: [
      { jenis: "Urea", kuotaKg: 160, sisaKg: 160 },
      { jenis: "NPK", kuotaKg: 120, sisaKg: 60 },
      { jenis: "Organik", kuotaKg: 200, sisaKg: 200 },
    ],
  },
  {
    nik: "1371041809900003",
    noTelp: "082145667890",
    nama: "Datuk Marajo",
    kelompokTani: "Tani Saiyo",
    desa: "Koto Baru",
    kecamatan: "Lubuk Sikaping",
    luasLahanHa: 1.8,
    komoditas: "Padi",
    status: "Terdaftar",
    alokasi: [
      { jenis: "Urea", kuotaKg: 360, sisaKg: 60 },
      { jenis: "NPK", kuotaKg: 270, sisaKg: 90 },
      { jenis: "Organik", kuotaKg: 450, sisaKg: 0 },
    ],
  },
  {
    nik: "1371040207950004",
    noTelp: "085277331209",
    nama: "Yusniar",
    kelompokTani: "Harapan Baru",
    desa: "Padang Ganting",
    kecamatan: "Padang Ganting",
    luasLahanHa: 0.5,
    komoditas: "Cabai",
    status: "Terdaftar",
    alokasi: [
      { jenis: "Urea", kuotaKg: 100, sisaKg: 100 },
      { jenis: "NPK", kuotaKg: 75, sisaKg: 75 },
      { jenis: "Organik", kuotaKg: 125, sisaKg: 50 },
    ],
  },
  {
    nik: "1371041105880005",
    noTelp: "081374556622",
    nama: "Khairul Anwar",
    kelompokTani: "Maju Bersama",
    desa: "Rambatan",
    kecamatan: "Rambatan",
    luasLahanHa: 2.0,
    komoditas: "Padi",
    status: "Terdaftar",
    alokasi: [
      { jenis: "Urea", kuotaKg: 400, sisaKg: 250 },
      { jenis: "NPK", kuotaKg: 300, sisaKg: 300 },
      { jenis: "Organik", kuotaKg: 500, sisaKg: 350 },
    ],
  },
  {
    nik: "1371042909920006",
    noTelp: "089612340078",
    nama: "Ramlah",
    kelompokTani: "Bundo Kanduang",
    desa: "Sungai Tarab",
    kecamatan: "Sungai Tarab",
    luasLahanHa: 0.6,
    komoditas: "Bawang Merah",
    status: "Pending",
    alokasi: [],
  },
];

export const TRANSAKSI: Transaksi[] = [
  { id: "TRX-2026-0148", nik: "1371042503780001", nama: "Bujang Salim", jenis: "Urea", jumlahKg: 100, total: 225000, kios: "KPL Koto Baru", tanggal: "2026-06-21T09:14:00" },
  { id: "TRX-2026-0151", nik: "1371041809900003", nama: "Datuk Marajo", jenis: "Organik", jumlahKg: 450, total: 360000, kios: "KPL Koto Baru", tanggal: "2026-06-22T10:02:00" },
  { id: "TRX-2026-0153", nik: "1371042503780001", nama: "Bujang Salim", jenis: "Organik", jumlahKg: 180, total: 144000, kios: "KPL Koto Baru", tanggal: "2026-06-24T08:41:00" },
  { id: "TRX-2026-0159", nik: "1371046612850002", nama: "Siti Rohana", jenis: "NPK", jumlahKg: 60, total: 138000, kios: "KPL Sungai Tarab", tanggal: "2026-06-26T13:20:00" },
  { id: "TRX-2026-0162", nik: "1371041809900003", nama: "Datuk Marajo", jenis: "Urea", jumlahKg: 300, total: 675000, kios: "KPL Koto Baru", tanggal: "2026-06-27T11:05:00" },
  { id: "TRX-2026-0167", nik: "1371040207950004", nama: "Yusniar", jenis: "Organik", jumlahKg: 75, total: 60000, kios: "KPL Padang Ganting", tanggal: "2026-06-29T09:58:00" },
];

// ── Materi edukasi: jadi knowledge base ringkas untuk system prompt chatbot ──
export const EDUKASI = {
  syaratSubsidi: [
    "Terdaftar dalam e-RDKK (Rencana Definitif Kebutuhan Kelompok) lewat kelompok tani.",
    "Mengelola lahan maksimal 2 hektar.",
    "Menanam salah satu dari 10 komoditas: padi, jagung, kedelai, cabai, bawang merah, bawang putih, kopi, tebu, kakao, atau ubi kayu.",
    "Penebusan di Kios Pupuk Lengkap (KPL) resmi dengan menunjukkan KTP asli.",
  ],
  caraTebus: [
    "Datang ke kios resmi dan tunjukkan KTP asli.",
    "Petugas memindai NIK untuk membuka data alokasi pupuk Anda.",
    "Tebus sesuai sisa kuota, bayar tunai sesuai HET, lalu tanda tangani bukti transaksi.",
  ],
  dosisAnjuran: {
    Padi: "Urea 200–250 kg/ha + NPK 150 kg/ha. Pupuk dasar saat tanam, susulan umur 21–30 hari.",
    Jagung: "Urea 200 kg/ha + NPK 150 kg/ha. Berikan bertahap mengikuti fase pertumbuhan.",
    Cabai: "NPK 200 kg/ha dengan pupuk organik sebagai dasar untuk kesuburan tanah jangka panjang.",
  },
  het: HET,
  tips: [
    "Gunakan pupuk organik sebagai dasar agar tanah tetap subur dan tidak bergantung penuh pada pupuk kimia.",
    "Tebus sesuai kebutuhan musim tanam—kuota dihitung untuk dua musim, jangan habiskan sekaligus.",
    "Simpan bukti transaksi sebagai catatan penebusan resmi Anda.",
  ],
};

// ── Helper lookup (di produksi: ganti jadi query DB by NIK) ──
export function cariPetani(kunci: string): Petani | null {
  const q = kunci.replace(/\s|-/g, "").trim();
  if (!q) return null;
  return (
    PETANI.find((p) => p.nik === q || p.noTelp === q) ?? null
  );
}

export function totalSisa(p: Petani): number {
  return p.alokasi.reduce((a, b) => a + b.sisaKg, 0);
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function statistikGlobal() {
  const totalPetani = PETANI.length;
  const terdaftar = PETANI.filter((p) => p.status === "Terdaftar").length;
  const totalKuota = PETANI.reduce((a, p) => a + p.alokasi.reduce((x, y) => x + y.kuotaKg, 0), 0);
  const totalSisaKg = PETANI.reduce((a, p) => a + p.alokasi.reduce((x, y) => x + y.sisaKg, 0), 0);
  const tertebus = totalKuota - totalSisaKg;
  const nilaiTransaksi = TRANSAKSI.reduce((a, t) => a + t.total, 0);
  return { totalPetani, terdaftar, totalKuota, totalSisaKg, tertebus, nilaiTransaksi, jumlahTransaksi: TRANSAKSI.length };
}
