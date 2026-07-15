"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { JENIS_LIST, type JenisPupuk } from "@/lib/data";
import { isValidJenisPupuk, parsePositiveKg, tahunAktif } from "@/lib/stock";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Pastikan pemanggil adalah petugas yang login.
async function requirePetugas(): Promise<ActionResult | null> {
  if (!isSupabaseAdminConfigured())
    return { ok: false, error: "Supabase belum dikonfigurasi." };
  try {
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
    return null;
  } catch {
    return { ok: false, error: "Gagal memverifikasi sesi." };
  }
}

function revalAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/pendaftar");
  revalidatePath("/admin/petani");
  revalidatePath("/admin/tebus");
  revalidatePath("/admin/stok");
  revalidatePath("/admin/transaksi");
}

// ── Setujui pendaftar: set Terdaftar + tulis alokasi ────────────────────────
export interface AlokasiInput {
  jenis: JenisPupuk;
  kuotaKg: number;
}

export async function setujuiPendaftar(
  nik: string,
  alokasi: AlokasiInput[]
): Promise<ActionResult> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    const sb = createSupabaseAdmin();
    const tahun = tahunAktif();
    const bersih = alokasi
      .filter((a) => JENIS_LIST.includes(a.jenis) && a.kuotaKg > 0)
      .map((a) => ({
        nik,
        tahun,
        jenis: a.jenis,
        kuota_kg: Math.round(a.kuotaKg),
        sisa_kg: Math.round(a.kuotaKg),
      }));
    if (bersih.length === 0)
      return { ok: false, error: "Minimal satu alokasi pupuk harus diisi." };

    const { data: transaksiBerjalan, error: cekTransaksiError } = await sb
      .from("transaksi")
      .select("id")
      .eq("nik", nik)
      .eq("tahun", tahun)
      .limit(1);
    if (cekTransaksiError) return { ok: false, error: cekTransaksiError.message };
    if (transaksiBerjalan && transaksiBerjalan.length > 0) {
      return { ok: false, error: "Alokasi tahun berjalan tidak dapat diterbitkan ulang setelah ada penebusan." };
    }

    // Ganti alokasi tahun berjalan tanpa menghapus tahun sebelumnya.
    const del = await sb.from("alokasi").delete().eq("nik", nik).eq("tahun", tahun);
    if (del.error) return { ok: false, error: del.error.message };
    const ins = await sb.from("alokasi").insert(bersih);
    if (ins.error) return { ok: false, error: ins.error.message };

    const upd = await sb
      .from("petani")
      .update({ status: "Terdaftar", catatan: null })
      .eq("nik", nik);
    if (upd.error) return { ok: false, error: upd.error.message };

    revalAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Tolak pendaftar ─────────────────────────────────────────────────────────
export async function tolakPendaftar(nik: string, alasan: string): Promise<ActionResult> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    const sb = createSupabaseAdmin();
    const tahun = tahunAktif();
    const upd = await sb
      .from("petani")
      .update({ status: "Ditolak", catatan: alasan?.trim() || "Tidak memenuhi syarat." })
      .eq("nik", nik);
    if (upd.error) return { ok: false, error: upd.error.message };
    await sb.from("alokasi").delete().eq("nik", nik).eq("tahun", tahun);
    revalAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Buat stok awal tahun ────────────────────────────────────────────────────
export async function buatStokAwal(
  jenis: JenisPupuk,
  jumlahKg: number,
  sumber: string,
  catatan: string
): Promise<ActionResult> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    if (!isValidJenisPupuk(jenis)) return { ok: false, error: "Jenis pupuk tidak valid." };
    const n = parsePositiveKg(String(jumlahKg));
    if (n == null) return { ok: false, error: "Jumlah stok awal harus berupa bilangan bulat positif." };

    const sb = createSupabaseAdmin();
    const { data, error } = await sb.rpc("buat_stok_awal", {
      p_tahun: tahunAktif(),
      p_jenis: jenis,
      p_jumlah: n,
      p_sumber: sumber?.trim() || "Stok awal tahun",
      p_catatan: catatan?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    const hasil = (data ?? {}) as { ok?: boolean; error?: string };
    if (!hasil.ok) return { ok: false, error: hasil.error || "Gagal membuat stok awal." };
    revalAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Tambah stok masuk ───────────────────────────────────────────────────────
export async function tambahStok(
  jenis: JenisPupuk,
  jumlahKg: number,
  sumber: string,
  catatan: string
): Promise<ActionResult & { stokTersediaKg?: number }> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    if (!isValidJenisPupuk(jenis)) return { ok: false, error: "Jenis pupuk tidak valid." };
    const n = parsePositiveKg(String(jumlahKg));
    if (n == null) return { ok: false, error: "Jumlah stok masuk harus berupa bilangan bulat positif." };

    const sb = createSupabaseAdmin();
    const { data, error } = await sb.rpc("tambah_stok", {
      p_tahun: tahunAktif(),
      p_jenis: jenis,
      p_jumlah: n,
      p_sumber: sumber?.trim() || "Penerimaan stok",
      p_catatan: catatan?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    const hasil = (data ?? {}) as { ok?: boolean; error?: string; stokTersediaKg?: number };
    if (!hasil.ok) return { ok: false, error: hasil.error || "Gagal menambah stok." };
    revalAdmin();
    return { ok: true, stokTersediaKg: hasil.stokTersediaKg };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Ubah status umum (mis. non-aktifkan / kembalikan ke pending) ────────────
export async function ubahStatusPetani(
  nik: string,
  status: "Pending" | "Terdaftar" | "Ditolak"
): Promise<ActionResult> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    const sb = createSupabaseAdmin();
    const upd = await sb.from("petani").update({ status }).eq("nik", nik);
    if (upd.error) return { ok: false, error: upd.error.message };
    revalAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Hapus petani permanen (cascade: alokasi + transaksi ikut terhapus) ──────
export async function hapusPetani(nik: string): Promise<ActionResult> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    const sb = createSupabaseAdmin();
    // alokasi & transaksi punya FK on delete cascade → cukup hapus baris petani.
    const del = await sb.from("petani").delete().eq("nik", nik);
    if (del.error) return { ok: false, error: del.error.message };
    revalAdmin();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Catat penebusan: validasi sisa → kurangi → insert transaksi ─────────────
export async function catatTebus(
  nik: string,
  jenis: JenisPupuk,
  jumlahKg: number,
  kios: string
): Promise<ActionResult & { transaksiId?: string }> {
  const guard = await requirePetugas();
  if (guard) return guard;
  try {
    const n = Math.round(jumlahKg);
    if (!n || n <= 0) return { ok: false, error: "Jumlah kg tidak valid." };

    const sb = createSupabaseAdmin();

    // Penebusan atomik via RPC Postgres (row lock FOR UPDATE) → anti race condition.
    const { data, error } = await sb.rpc("tebus_pupuk", {
      p_nik: nik,
      p_jenis: jenis,
      p_jumlah: n,
      p_kios: kios,
      p_tahun: tahunAktif(),
    });
    if (error) return { ok: false, error: error.message };

    const hasil = (data ?? {}) as { ok?: boolean; error?: string; transaksiId?: string };
    if (!hasil.ok) return { ok: false, error: hasil.error || "Gagal mencatat penebusan." };

    revalAdmin();
    return { ok: true, transaksiId: hasil.transaksiId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
