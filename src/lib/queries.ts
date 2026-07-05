import "server-only";
import { createSupabaseAdmin } from "./supabase/admin";
import { isSupabaseAdminConfigured } from "./supabase/config";
import {
  URUTAN_JENIS,
  type Alokasi,
  type Edukasi,
  type HETMap,
  type JenisPupuk,
  type Petani,
  type StatusPetani,
  type Transaksi,
} from "./data";

// ── Mapper baris DB (snake_case) → tipe app (camelCase) ─────────────────────

type AlokasiRow = { jenis: JenisPupuk; kuota_kg: number; sisa_kg: number };
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

function mapAlokasi(rows: AlokasiRow[] = []): Alokasi[] {
  return rows
    .map((a) => ({ jenis: a.jenis, kuotaKg: a.kuota_kg, sisaKg: a.sisa_kg }))
    .sort((x, y) => URUTAN_JENIS[x.jenis] - URUTAN_JENIS[y.jenis]);
}

function mapPetani(row: PetaniRow): Petani {
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
    alokasi: mapAlokasi(row.alokasi),
  };
}

const PETANI_SELECT = "*, alokasi(jenis, kuota_kg, sisa_kg)";

// ── Query publik (dipakai Server Component / Server Action / API route) ─────

export async function getPetaniList(): Promise<Petani[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("petani")
      .select(PETANI_SELECT)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as PetaniRow[]).map(mapPetani);
  } catch {
    return [];
  }
}

export async function getPetaniByStatus(status: StatusPetani): Promise<Petani[]> {
  const all = await getPetaniList();
  return all.filter((p) => p.status === status);
}

export async function cariPetani(kunci: string): Promise<Petani | null> {
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
    return mapPetani(data[0] as PetaniRow);
  } catch {
    return null;
  }
}

export async function getTransaksi(): Promise<Transaksi[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("transaksi")
      .select("*")
      .order("tanggal", { ascending: true });
    if (error || !data) return [];
    return data.map((t) => ({
      id: t.id,
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

export async function statistikGlobal(): Promise<StatGlobal> {
  const [petani, transaksi] = await Promise.all([getPetaniList(), getTransaksi()]);
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
