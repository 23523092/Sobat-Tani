import { cariPetani, EDUKASI, formatRupiah, totalSisa, type Petani } from "./data";

export interface ChatMsg {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any;
  tool_call_id?: string;
}

// ── Backstop deterministik: ekstrak NIK/telp dari teks (jaring pengaman) ──
export function ekstrakKunci(teks: string): string | null {
  const nik = teks.match(/\b\d{16}\b/);
  if (nik) return nik[0];
  const telp = teks.match(/\b0\d{9,12}\b/);
  if (telp) return telp[0];
  return null;
}

// ── Bentuk data terstruktur hasil verifikasi (dipakai sebagai tool result) ──
function profilData(p: Petani) {
  return {
    ditemukan: true,
    nama: p.nama,
    kelompok_tani: p.kelompokTani,
    desa: p.desa,
    kecamatan: p.kecamatan,
    luas_lahan_ha: p.luasLahanHa,
    komoditas: p.komoditas,
    status: p.status,
    sisa_kuota: p.alokasi.map((a) => ({
      jenis: a.jenis,
      sisa_kg: a.sisaKg,
      jatah_kg: a.kuotaKg,
      het_per_kg: EDUKASI.het[a.jenis],
    })),
  };
}

// ── Definisi tool: AI yang memutuskan kapan & data apa untuk verifikasi ──
const TOOLS = [
  {
    type: "function",
    function: {
      name: "verifikasi_petani",
      description:
        "Verifikasi & ambil data petani penerima pupuk subsidi dari basis data e-RDKK menggunakan NIK (16 digit) ATAU nomor telepon terdaftar. Panggil fungsi ini segera setelah petani menyebutkan NIK atau nomor teleponnya, walau ditulis di tengah kalimat. Ekstrak hanya angka identitasnya.",
      parameters: {
        type: "object",
        properties: {
          nik_atau_telp: {
            type: "string",
            description: "NIK 16 digit atau nomor telepon petani — angka saja, tanpa spasi/tanda baca.",
          },
        },
        required: ["nik_atau_telp"],
      },
    },
  },
];

const BASE_PROMPT = `Kamu adalah "Asisten Tani", petugas call center digital layanan pupuk subsidi pemerintah. Gaya bicaramu hangat, sopan, sabar, bahasa Indonesia sederhana yang mudah dipahami petani. Jawaban ringkas dan jelas.

Tugas:
1. Memverifikasi petani dan menampilkan SISA kuota pupuk subsidinya (Urea/NPK/Organik dalam kg).
2. Menyelipkan EDUKASI singkat bila relevan: syarat subsidi, cara menebus, dosis pupuk per komoditas, tips kesuburan tanah.
3. Mengingatkan penebusan dilakukan di kios resmi (KPL) dengan membawa KTP asli.

Cara kerja verifikasi:
- Begitu petani menyebut NIK (16 digit) atau nomor telepon, PANGGIL fungsi "verifikasi_petani" dengan angka tersebut. Jangan menebak isi data sendiri.
- Jika fungsi mengembalikan "ditemukan: false", sampaikan dengan sopan bahwa data belum ditemukan di e-RDKK dan minta petani memeriksa NIK/nomornya atau menghubungi ketua kelompok tani.
- Jika belum ada NIK/telepon, minta dengan ramah.

Aturan: jangan pernah mengarang data. Jangan meminta PIN/OTP/password. Tidak ada pembayaran lewat chat.

Pengetahuan edukasi:
- Syarat subsidi: ${EDUKASI.syaratSubsidi.join(" ")}
- Cara menebus: ${EDUKASI.caraTebus.join(" ")}
- HET per kg: Urea ${formatRupiah(EDUKASI.het.Urea)}, NPK ${formatRupiah(EDUKASI.het.NPK)}, Organik ${formatRupiah(EDUKASI.het.Organik)}.
- Tips: ${EDUKASI.tips.join(" ")}`;

function systemPrompt(known: Petani | null): string {
  if (known) {
    return `${BASE_PROMPT}\n\nKonteks: petani ini SUDAH terverifikasi sebelumnya — ${JSON.stringify(
      profilData(known)
    )}. Gunakan data ini untuk menjawab. Panggil "verifikasi_petani" lagi HANYA jika petani menyebut NIK/nomor yang berbeda.`;
  }
  return BASE_PROMPT;
}

async function callGroq(messages: ChatMsg[], withTools: boolean) {
  const key = process.env.GROQ_API_KEY!;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    }),
  });
  if (!res.ok) throw new Error("groq " + res.status);
  return res.json();
}

/**
 * Orkestrasi function calling. AI sendiri yang mendeteksi NIK/telp dari pesan,
 * memanggil tool verifikasi, lalu menyusun jawaban dari data terverifikasi.
 * Return null bila tidak ada API key (caller pakai fallback rule-based).
 */
export async function panggilGroqTool(
  riwayat: ChatMsg[],
  known: Petani | null
): Promise<{ reply: string; petani: Petani | null } | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const sys: ChatMsg = { role: "system", content: systemPrompt(known) };
    const msgs: ChatMsg[] = [sys, ...riwayat.slice(-8)];

    const r1 = await callGroq(msgs, true);
    const m1 = r1?.choices?.[0]?.message;
    if (!m1) return null;

    if (m1.tool_calls?.length) {
      let found: Petani | null = known;
      const toolMsgs: ChatMsg[] = [];
      for (const tc of m1.tool_calls) {
        let arg = "";
        try {
          arg = JSON.parse(tc.function?.arguments || "{}").nik_atau_telp || "";
        } catch {
          arg = "";
        }
        const p = cariPetani(arg);
        if (p) found = p;
        toolMsgs.push({
          role: "tool",
          tool_call_id: tc.id,
          content: p ? JSON.stringify(profilData(p)) : JSON.stringify({ ditemukan: false }),
        });
      }
      const r2 = await callGroq([...msgs, m1 as ChatMsg, ...toolMsgs], false);
      const reply = r2?.choices?.[0]?.message?.content;
      if (!reply) return null;
      return { reply, petani: found };
    }

    if (!m1.content) return null;
    return { reply: m1.content, petani: known };
  } catch {
    return null;
  }
}

// ── Fallback cerdas berbasis aturan (dipakai bila tanpa API key) ──
export function jawabFallback(pesanUser: string, p: Petani | null): string {
  const t = pesanUser.toLowerCase();

  if (!p) {
    const kunci = ekstrakKunci(pesanUser);
    if (kunci && !cariPetani(kunci))
      return "Maaf, data dengan nomor tersebut belum ditemukan di sistem e-RDKK. Pastikan NIK 16 digit atau nomor telepon yang terdaftar sudah benar, atau hubungi ketua kelompok tani Anda.";
    return "Halo, selamat datang di layanan Pupuk Subsidi. Untuk mengecek sisa kuota pupuk Anda, silakan ketik NIK (16 digit) atau nomor telepon yang terdaftar ya.";
  }

  if (p.status === "Pending")
    return `Halo ${p.nama}, data Anda masih berstatus menunggu verifikasi di e-RDKK, jadi alokasi pupuk belum terbit. Silakan hubungi ketua Kelompok Tani ${p.kelompokTani} untuk menyelesaikan pendaftaran.`;

  if (t.includes("dosis") || t.includes("takaran") || t.includes("cara pakai") || t.includes("pemupukan")) {
    const d = (EDUKASI.dosisAnjuran as Record<string, string>)[p.komoditas];
    return d
      ? `Untuk ${p.komoditas}, anjuran umum: ${d}\n\nTetap sesuaikan dengan kondisi tanah dan rekomendasi penyuluh setempat ya, ${p.nama}.`
      : "Anjuran dosis berbeda tiap komoditas. Sebaiknya konsultasikan dengan penyuluh pertanian (PPL) di wilayah Anda untuk takaran yang tepat.";
  }
  if (t.includes("syarat") || t.includes("daftar")) return "Syarat mendapat pupuk subsidi: " + EDUKASI.syaratSubsidi.join(" ");
  if (t.includes("cara") && (t.includes("tebus") || t.includes("beli") || t.includes("ambil")))
    return "Cara menebus pupuk subsidi: " + EDUKASI.caraTebus.join(" ");
  if (t.includes("harga") || t.includes("het") || t.includes("bayar"))
    return `Harga Eceran Tertinggi (HET): Urea ${formatRupiah(EDUKASI.het.Urea)}/kg, NPK ${formatRupiah(
      EDUKASI.het.NPK
    )}/kg, Organik ${formatRupiah(EDUKASI.het.Organik)}/kg. Pembayaran tunai di kios resmi, bukan lewat chat ini.`;

  const rincian = p.alokasi.map((a) => `• ${a.jenis}: sisa ${a.sisaKg} kg dari ${a.kuotaKg} kg`).join("\n");
  const habis = p.alokasi.filter((a) => a.sisaKg === 0).map((a) => a.jenis);
  const catatan =
    habis.length > 0
      ? `\n\nCatatan: kuota ${habis.join(" & ")} Anda sudah habis untuk musim ini.`
      : `\n\nTotal sisa yang bisa Anda tebus: ${totalSisa(p)} kg. Bawa KTP asli ke kios resmi (KPL) terdekat ya.`;
  return `Halo ${p.nama} dari ${p.kelompokTani} 🌾\nBerikut sisa kuota pupuk subsidi Anda:\n${rincian}${catatan}`;
}
