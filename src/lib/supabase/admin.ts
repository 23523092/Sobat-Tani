import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceKey } from "./config";

/**
 * Client service-role — HANYA server. Bypass RLS untuk operasi data
 * (baca dashboard, catat tebus, verifikasi pendaftar, registrasi publik).
 * Jangan pernah diimpor ke kode client.
 */
export function createSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl()!, supabaseServiceKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
