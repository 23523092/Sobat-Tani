import "server-only";
import { createSupabaseAdmin } from "./supabase/admin";
import { isSupabaseAdminConfigured } from "./supabase/config";
import {
  JENIS_LIST,
  URUTAN_JENIS,
  type Alokasi,
  type Edukasi,
  type HETMap,
  type JenisPupuk,
  type Petani,
  type StatusPetani,
  type PenerimaanStok,
  type StokTahunan,
  type Transaksi,
} from "./data";
import { summarizeStok, tahunAktif } from "./stock";

// ── Mapper baris DB (snake_case) → tipe app (camelCase) ─────────────────────

type AlokasiRow = { tahun: number; jenis: JenisPupuk; kuota_kg: number; sisa_kg: number };
type PetaniRow = {
  nik: string;
  no_telp: string;
  nama: string;
  kelompok_tani: string;
  desa: string;
  kecamatan: string;
  luas_lahan_ha: number | string;
  komoditas: string;
  status: StatusPetani;
  catatan: string | null;
  created_at?: string;
  alokasi?: AlokasiRow[];
};

function mapAlokasi(rows: AlokasiRow[] = [], tahun: number): Alokasi[] {
  return rows
    .filter((a) => Number(a.tahun) === tahun)
    .map((a) => ({ tahun, jenis: a.jenis, kuotaKg: a.kuota_kg, sisaKg: a.sisa_kg }))
    .sort((x, y) => URUTAN_JENIS[x.jenis] - URUTAN_JENIS[y.jenis]);
}

function mapPetani(row: PetaniRow, tahun: number): Petani {
  return {
    nik: row.nik,
    noTelp: row.no_telp,
    nama: row.nama,
    kelompokTani: row.kelompok_tani,
    desa: row.desa,
    kecamatan: row.kecamatan,
    luasLahanHa: Number(row.luas_lahan_ha),
    komoditas: row.komoditas,
    status: row.status,
    catatan: row.catatan,
    alokasi: mapAlokasi(row.alokasi, tahun),
  };
}

const PETANI_SELECT = "*, alokasi(tahun, jenis, kuota_kg, sisa_kg)";

// ── Query publik (dipakai Server Component / Server Action / API route) ─────

export async function getPetaniList(tahun = tahunAktif()): Promise<Petani[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("petani")
      .select(PETANI_SELECT)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as PetaniRow[]).map((row) => mapPetani(row, tahun));
  } catch {
    return [];
  }
}

export async function getPetaniByStatus(status: StatusPetani, tahun = tahunAktif()): Promise<Petani[]> {
  const all = await getPetaniList(tahun);
  return all.filter((p) => p.status === status);
}

export async function cariPetani(kunci: string, tahun = tahunAktif()): Promise<Petani | null> {
  if (!isSupabaseAdminConfigured()) return null;
  // NIK & nomor telepon selalu angka — buang karakter non-digit.
  // Ini juga mencegah injeksi ke filter PostgREST .or().
  const q = (kunci || "").replace(/\D/g, "").trim();
  if (!q) return null;
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("petani")
      .select(PETANI_SELECT)
      .or(`nik.eq.${q},no_telp.eq.${q}`)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return mapPetani(data[0] as PetaniRow, tahun);
  } catch {
    return null;
  }
}

export async function getTransaksi(tahun?: number): Promise<Transaksi[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const sb = createSupabaseAdmin();
    let query = sb.from("transaksi").select("*").order("tanggal", { ascending: true });
    if (tahun != null) query = query.eq("tahun", tahun);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((t) => ({
      id: t.id,
      tahun: Number(t.tahun),
      nik: t.nik,
      nama: t.nama,
      jenis: t.jenis,
      jumlahKg: t.jumlah_kg,
      total: t.total,
      kios: t.kios,
      tanggal: t.tanggal,
    }));
  } catch {
    return [];
  }
}

export async function getPenerimaanStok(tahun = tahunAktif()): Promise<PenerimaanStok[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("penerimaan_stok")
      .select("*")
      .eq("tahun", tahun)
      .order("tanggal", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      tahun: Number(r.tahun),
      jenis: r.jenis as JenisPupuk,
      jumlahKg: Number(r.jumlah_kg),
      sumber: r.sumber,
      catatan: r.catatan,
      tanggal: r.tanggal,
    }));
  } catch {
    return [];
  }
}

export async function getStokTahunan(tahun = tahunAktif()): Promise<StokTahunan[]> {
  const kosong = JENIS_LIST.map((jenis) => ({
    tahun,
    jenis,
    stokAwalKg: 0,
    stokTersediaKg: 0,
    masukKg: 0,
    keluarKg: 0,
    persentaseTerserap: 0,
  }));
  if (!isSupabaseAdminConfigured()) return kosong;
  try {
    const sb = createSupabaseAdmin();
    const [stok, penerimaan, transaksi] = await Promise.all([
      sb.from("stok_tahunan").select("*").eq("tahun", tahun),
      sb.from("penerimaan_stok").select("jenis, jumlah_kg").eq("tahun", tahun),
      sb.from("transaksi").select("jenis, jumlah_kg").eq("tahun", tahun),
    ]);
    if (stok.error || penerimaan.error || transaksi.error) return kosong;

    return JENIS_LIST.map((jenis) => {
      const row = (stok.data ?? []).find((r) => r.jenis === jenis);
      const totalPenerimaan = (penerimaan.data ?? [])
        .filter((r) => r.jenis === jenis)
        .reduce((sum, r) => sum + Number(r.jumlah_kg), 0);
      const keluarKg = (transaksi.data ?? [])
        .filter((r) => r.jenis === jenis)
        .reduce((sum, r) => sum + Number(r.jumlah_kg), 0);
      const stokAwalKg = Number(row?.stok_awal_kg ?? 0);
      const summary = summarizeStok(
        stokAwalKg,
        Math.max(0, totalPenerimaan - stokAwalKg),
        keluarKg,
        Number(row?.stok_tersedia_kg ?? 0)
      );
      return {
        tahun,
        jenis,
        stokAwalKg: summary.stokAwalKg,
        stokTersediaKg: summary.tersediaKg,
        masukKg: summary.masukKg,
        keluarKg: summary.keluarKg,
        persentaseTerserap: summary.persentaseTerserap,
      };
    });
  } catch {
    return kosong;
  }
}

export async function getHET(): Promise<HETMap> {
  const kosong = {} as HETMap;
  if (!isSupabaseAdminConfigured()) return kosong;
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb.from("het").select("*");
    if (error || !data) return kosong;
    const map = {} as HETMap;
    for (const row of data) map[row.jenis as JenisPupuk] = row.harga;
    return map;
  } catch {
    return kosong;
  }
}

export async function getEdukasi(): Promise<Edukasi> {
  const kosong: Edukasi = {
    syaratSubsidi: [],
    caraTebus: [],
    tips: [],
    dosisAnjuran: {},
    het: {} as HETMap,
  };
  if (!isSupabaseAdminConfigured()) return kosong;
  try {
    const sb = createSupabaseAdmin();
    const [edu, dos, het] = await Promise.all([
      sb.from("edukasi").select("*").order("urutan", { ascending: true }),
      sb.from("dosis").select("*"),
      getHET(),
    ]);
    const rows = edu.data ?? [];
    const pick = (kat: string) =>
      rows.filter((r) => r.kategori === kat).map((r) => r.isi as string);
    const dosisAnjuran: Record<string, string> = {};
    for (const d of dos.data ?? []) dosisAnjuran[d.komoditas] = d.anjuran;
    return {
      syaratSubsidi: pick("syarat"),
      caraTebus: pick("cara_tebus"),
      tips: pick("tips"),
      dosisAnjuran,
      het,
    };
  } catch {
    return kosong;
  }
}

export interface StatGlobal {
  totalPetani: number;
  terdaftar: number;
  pending: number;
  ditolak: number;
  totalKuota: number;
  totalSisaKg: number;
  tertebus: number;
  nilaiTransaksi: number;
  jumlahTransaksi: number;
}

export async function statistikGlobal(tahun = tahunAktif()): Promise<StatGlobal> {
  const [petani, transaksi] = await Promise.all([getPetaniList(tahun), getTransaksi(tahun)]);
  const sumAlok = (pick: (a: Alokasi) => number) =>
    petani.reduce((a, p) => a + p.alokasi.reduce((x, y) => x + pick(y), 0), 0);
  const totalKuota = sumAlok((a) => a.kuotaKg);
  const totalSisaKg = sumAlok((a) => a.sisaKg);
  return {
    totalPetani: petani.length,
    terdaftar: petani.filter((p) => p.status === "Terdaftar").length,
    pending: petani.filter((p) => p.status === "Pending").length,
    ditolak: petani.filter((p) => p.status === "Ditolak").length,
    totalKuota,
    totalSisaKg,
    tertebus: totalKuota - totalSisaKg,
    nilaiTransaksi: transaksi.reduce((a, t) => a + t.total, 0),
    jumlahTransaksi: transaksi.length,
  };
}
