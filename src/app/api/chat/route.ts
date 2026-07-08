import { NextRequest, NextResponse } from "next/server";
import { type Petani } from "@/lib/data";
import { cariPetani, getEdukasi } from "@/lib/queries";
import { ekstrakKunci, jawabFallback, panggilGroqTool, type ChatMsg } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 30; // detik — beri ruang untuk beberapa panggilan Groq

// Jaring pengaman: bersihkan em-dash/en-dash dari jawaban (model kadang tetap memakainya).
function tanpaDash(t: string): string {
  return t.replace(/\s*—\s*/g, ", ").replace(/\s*–\s*/g, "-");
}

// ── Rate limit sederhana per-IP (in-memory) — kurangi abuse/enumerasi ──
const HITS = new Map<string, number[]>();
const RATE_LIMIT = 20; // pesan
const RATE_WINDOW = 60_000; // per 60 detik

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear(); // jaga memori
  return arr.length > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    if (rateLimited(ip)) {
      return NextResponse.json(
        {
          reply: "Anda mengirim terlalu banyak pesan dalam waktu singkat. Mohon tunggu sebentar ya.",
          verified: false,
          mode: "limit",
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const messages: ChatMsg[] = Array.isArray(body.messages) ? body.messages : [];
    let nik: string | null = typeof body.nik === "string" ? body.nik : null;

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const edu = await getEdukasi();

    // Petani yang sudah dikenal dari sesi (kontinuitas state)
    const known: Petani | null = nik ? await cariPetani(nik) : null;

    // ── Jalur utama: AI mendeteksi & memverifikasi sendiri lewat function calling ──
    const hasil = await panggilGroqTool(messages, known, edu);
    if (hasil) {
      const p = hasil.petani;
      return NextResponse.json({
        reply: tanpaDash(hasil.reply),
        nik: p?.nik ?? nik,
        verified: !!p,
        mode: "groq",
      });
    }

    // ── Fallback (tanpa API key): deteksi via regex backstop + jawaban rule-based ──
    let petani: Petani | null = known;
    if (!petani) {
      const kunci = ekstrakKunci(lastUser);
      if (kunci) {
        petani = await cariPetani(kunci);
        if (petani) nik = petani.nik;
      }
    }
    return NextResponse.json({
      reply: tanpaDash(jawabFallback(lastUser, petani, edu)),
      nik,
      verified: !!petani,
      mode: "fallback",
    });
  } catch (e) {
    console.error("[api/chat] error:", (e as Error)?.message || e);
    return NextResponse.json(
      { reply: "Maaf, sistem sedang sibuk. Coba lagi sebentar ya.", verified: false, mode: "error" },
      { status: 200 }
    );
  }
}
