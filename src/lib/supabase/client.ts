import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "./config";

/** Client Supabase untuk browser (dipakai halaman login). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl()!, supabaseAnonKey()!);
}
