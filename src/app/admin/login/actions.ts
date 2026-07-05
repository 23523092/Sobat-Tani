"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/config";

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  if (!isSupabasePublicConfigured())
    return { error: "Supabase belum dikonfigurasi. Isi .env.local dulu." };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau password salah." };

  redirect(next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
}

export async function logoutAction() {
  const sb = await createSupabaseServerClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}
