// Deteksi apakah kredensial Supabase tersedia di environment.
// Dipakai agar aplikasi degrade dengan anggun (empty state) saat belum dikonfigurasi,
// sehingga build & dev tetap jalan tanpa .env.local terisi.

export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}
export function supabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
export function supabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** True bila client publik (browser/auth) bisa dibuat. */
export function isSupabasePublicConfigured() {
  return !!(supabaseUrl() && supabaseAnonKey());
}

/** True bila operasi data server (service role) bisa dijalankan. */
export function isSupabaseAdminConfigured() {
  return !!(supabaseUrl() && supabaseServiceKey());
}
