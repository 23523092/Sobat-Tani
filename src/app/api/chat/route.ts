import { NextRequest, NextResponse } from "next/server";
import { cariPetani, type Petani } from "@/lib/data";
import { ekstrakKunci, jawabFallback, panggilGroqTool, type ChatMsg } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMsg[] = Array.isArray(body.messages) ? body.messages : [];
    let nik: string | null = typeof body.nik === "string" ? body.nik : null;

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Petani yang sudah dikenal dari sesi (kontinuitas state)
    const known: Petani | null = nik ? cariPetani(nik) : null;

    // ── Jalur utama: AI mendeteksi & memverifikasi sendiri lewat function calling ──
    const hasil = await panggilGroqTool(messages, known);
    if (hasil) {
      const p = hasil.petani;
      return NextResponse.json({
        reply: hasil.reply,
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
        petani = cariPetani(kunci);
        if (petani) nik = petani.nik;
      }
    }
    return NextResponse.json({
      reply: jawabFallback(lastUser, petani),
      nik,
      verified: !!petani,
      mode: "fallback",
    });
  } catch {
    return NextResponse.json(
      { reply: "Maaf, sistem sedang sibuk. Coba lagi sebentar ya.", verified: false, mode: "error" },
      { status: 200 }
    );
  }
}
