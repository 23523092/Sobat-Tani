"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export interface DaftarResult {
  ok: boolean;
  error?: string;
}

// Registrasi petani publik → masuk antrean Pending untuk diverifikasi petugas.
export async function daftarPetani(input: {
  nik: string;
  noTelp: string;
  nama: string;
  kelompokTani: string;
  desa: string;
  kecamatan: string;
  luasLahanHa: number;
  komoditas: string;
}): Promise<DaftarResult> {
  if (!isSupabaseAdminConfigured())
    return { ok: false, error: "Layanan pendaftaran belum aktif. Hubungi petugas." };

  const nik = (input.nik || "").replace(/\D/g, "");
  const noTelp = (input.noTelp || "").replace(/\s|-/g, "");
  const nama = (input.nama || "").trim();

  if (nik.length !== 16) return { ok: false, error: "NIK harus 16 digit angka." };
  if (!/^0\d{8,13}$/.test(noTelp)) return { ok: false, error: "Nomor telepon tidak valid." };
  if (nama.length < 3) return { ok: false, error: "Nama lengkap wajib diisi." };
  if (!input.kelompokTani?.trim()) return { ok: false, error: "Kelompok tani wajib diisi." };
  if (!input.desa?.trim() || !input.kecamatan?.trim())
    return { ok: false, error: "Desa & kecamatan wajib diisi." };
  if (!input.komoditas?.trim()) return { ok: false, error: "Komoditas wajib diisi." };
  const luas = Number(input.luasLahanHa);
  if (!luas || luas <= 0) return { ok: false, error: "Luas lahan tidak valid." };
  if (luas > 2)
    return { ok: false, error: "Subsidi hanya untuk lahan maksimal 2 hektar." };

  try {
    const sb = createSupabaseAdmin();
    const { data: ada } = await sb.from("petani").select("nik").eq("nik", nik).maybeSingle();
    if (ada) return { ok: false, error: "NIK ini sudah terdaftar di sistem." };

    const { error } = await sb.from("petani").insert({
      nik,
      no_telp: noTelp,
      nama,
      kelompok_tani: input.kelompokTani.trim(),
      desa: input.desa.trim(),
      kecamatan: input.kecamatan.trim(),
      luas_lahan_ha: luas,
      komoditas: input.komoditas.trim(),
      status: "Pending",
    });
    if (error) {
      // 23505 = unique_violation (NIK sudah ada, mis. balapan dua pendaftaran)
      if ((error as { code?: string }).code === "23505")
        return { ok: false, error: "NIK ini sudah terdaftar di sistem." };
      return { ok: false, error: "Pendaftaran gagal diproses. Coba lagi sebentar ya." };
    }

    revalidatePath("/admin/pendaftar");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
