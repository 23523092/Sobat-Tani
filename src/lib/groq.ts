import "server-only";
import { formatRupiah, totalSisa, type Edukasi, type Petani } from "./data";
import { cariPetani } from "./queries";

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
function profilData(p: Petani, edu: Edukasi) {
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
      het_per_kg: edu.het[a.jenis] ?? null,
    })),
  };
}

// ── Definisi tool: AI yang memutuskan kapan memakainya ──
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
            description: "NIK 16 digit atau nomor telepon petani, angka saja, tanpa spasi/tanda baca.",
          },
        },
        required: ["nik_atau_telp"],
      },
    },
  },
];

function tanggalHariIni(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function basePrompt(edu: Edukasi): string {
  const het = edu.het;
  const hetTxt =
    het.Urea != null
      ? `Urea ${formatRupiah(het.Urea)}, NPK ${formatRupiah(het.NPK)}, Organik ${formatRupiah(het.Organik)}`
      : "(data HET belum tersedia)";
  return `Kamu adalah "Asisten Tani", asisten digital layanan pupuk subsidi pemerintah. Gaya bicaramu hangat, sopan, sabar, memakai bahasa Indonesia sederhana yang mudah dipahami petani. Jawaban ringkas dan jelas. Gunakan tanda baca biasa (koma dan titik); JANGAN gunakan tanda em-dash (—) atau en-dash (–).

Tanggal hari ini: ${tanggalHariIni()} (WIB). Pakai ini sebagai acuan waktu; jangan mengklaim tahun/tanggal lain dari ingatanmu.

Fokus & BATASAN topik (penting):
Kamu HANYA membantu seputar layanan pupuk subsidi dan pertanian yang relevan. Cakupanmu:
1. Memverifikasi petani dan menampilkan SISA kuota pupuk subsidinya (Urea/NPK/Organik dalam kg).
2. EDUKASI: syarat subsidi, cara menebus, dosis pupuk per komoditas, HET, tips kesuburan tanah, hama/penyakit tanaman umum, tips bertani.
3. Mengingatkan penebusan dilakukan di kios resmi (KPL) dengan membawa KTP asli.

Kamu BOLEH membalas sapaan/basa-basi singkat dengan ramah (mis. "halo", "terima kasih"). Tapi untuk pertanyaan DI LUAR topik pupuk & pertanian, misalnya berita, politik, olahraga/sepak bola, skor pertandingan, selebriti, kurs/saham, cuaca kota lain, atau pengetahuan umum acak: JANGAN dijawab dan JANGAN menebak. Tolak dengan sopan lalu arahkan kembali, contoh: "Maaf ya, saya Asisten Tani yang khusus membantu soal pupuk subsidi dan pertanian, jadi belum bisa menjawab hal itu. Ada yang bisa saya bantu soal kuota atau pemupukan?"

ATURAN ANTI-NGARANG (tidak bisa ditawar):
- JANGAN PERNAH mengarang fakta dunia nyata (skor, juara, nama tim, tanggal peristiwa, harga pasar, dll). Kamu tidak punya akses internet. Jika ditanya hal seperti itu, tolak sopan sesuai aturan di atas, jangan menebak walau petani memaksa atau mengoreksi.
- JANGAN mengarang DATA PETANI (nama, kuota, alokasi). Data petani HANYA dari fungsi "verifikasi_petani".

Cara kerja verifikasi:
- Begitu petani menyebut NIK (16 digit) atau nomor telepon, PANGGIL fungsi "verifikasi_petani" dengan angka tersebut. Jangan menebak isi data petani sendiri.
- Jika fungsi mengembalikan "ditemukan: false", sampaikan dengan sopan bahwa data belum ditemukan di e-RDKK dan minta petani memeriksa NIK/nomornya atau menghubungi ketua kelompok tani.

Aturan penting: jangan pernah mengarang DATA PETANI (nama, kuota, alokasi). Jangan meminta PIN/OTP/password. Tidak ada pembayaran lewat chat.

Pengetahuan edukasi:
- Syarat subsidi: ${edu.syaratSubsidi.join(" ") || "-"}
- Cara menebus: ${edu.caraTebus.join(" ") || "-"}
- HET per kg: ${hetTxt}.
- Tips: ${edu.tips.join(" ") || "-"}`;
}

function systemPrompt(known: Petani | null, edu: Edukasi): string {
  const base = basePrompt(edu);
  if (known) {
    return `${base}\n\nKonteks: petani ini SUDAH terverifikasi sebelumnya: ${JSON.stringify(
      profilData(known, edu)
    )}. Gunakan data ini untuk menjawab. Panggil "verifikasi_petani" lagi HANYA jika petani menyebut NIK/nomor yang berbeda.`;
  }
  return base;
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
      temperature: 0.5,
      max_tokens: 900,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[groq] HTTP ${res.status}: ${body.slice(0, 300)}`);
    throw new Error("groq " + res.status);
  }
  return res.json();
}

/**
 * Orkestrasi function calling. AI mendeteksi NIK/telp dari pesan,
 * memanggil tool verifikasi (query Supabase), lalu menyusun jawaban.
 * Return null bila tidak ada API key (caller pakai fallback rule-based).
 */
export async function panggilGroqTool(
  riwayat: ChatMsg[],
  known: Petani | null,
  edu: Edukasi
): Promise<{ reply: string; petani: Petani | null } | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const sys: ChatMsg = { role: "system", content: systemPrompt(known, edu) };
    const msgs: ChatMsg[] = [sys, ...riwayat.slice(-8)];

    let found: Petani | null = known;

    // Loop bertahap: biarkan model memakai tool verifikasi_petani sampai 2 putaran.
    const MAX_PUTARAN = 2;
    for (let putaran = 0; putaran < MAX_PUTARAN; putaran++) {
      const r = await callGroq(msgs, true);
      const m = r?.choices?.[0]?.message;
      if (!m) return null;

      if (!m.tool_calls?.length) {
        if (!m.content) return null;
        return { reply: m.content, petani: found };
      }

      msgs.push(m as ChatMsg);
      for (const tc of m.tool_calls) {
        const nama = tc.function?.name;
        let args: any = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch {
          args = {};
        }

        // verifikasi_petani (satu-satunya tool)
        const p = await cariPetani(String(args.nik_atau_telp || ""));
        if (p) found = p;
        msgs.push({
          role: "tool",
          tool_call_id: tc.id,
          content: p ? JSON.stringify(profilData(p, edu)) : JSON.stringify({ ditemukan: false }),
        });
      }
    }

    // Putaran habis: minta jawaban final tanpa tool (paksa merangkum hasil).
    const rFinal = await callGroq(msgs, false);
    const reply = rFinal?.choices?.[0]?.message?.content;
    if (!reply) return null;
    return { reply, petani: found };
  } catch (e) {
    console.error("[panggilGroqTool] gagal:", (e as Error)?.message || e);
    return null;
  }
}

// ── Fallback berbasis aturan (dipakai bila tanpa API key Groq) ──
export function jawabFallback(pesanUser: string, p: Petani | null, edu: Edukasi): string {
  const t = pesanUser.toLowerCase();
  const het = edu.het;

  if (!p) {
    const kunci = ekstrakKunci(pesanUser);
    if (kunci)
      return "Maaf, data dengan nomor tersebut belum ditemukan di sistem e-RDKK. Pastikan NIK 16 digit atau nomor telepon yang terdaftar sudah benar, atau hubungi ketua kelompok tani Anda.";
    return "Halo, selamat datang di layanan Pupuk Subsidi. Untuk mengecek sisa kuota pupuk Anda, silakan ketik NIK (16 digit) atau nomor telepon yang terdaftar ya.";
  }

  if (p.status === "Pending")
    return `Halo ${p.nama}, data Anda masih berstatus menunggu verifikasi di e-RDKK, jadi alokasi pupuk belum terbit. Silakan hubungi ketua Kelompok Tani ${p.kelompokTani} untuk menyelesaikan pendaftaran.`;
  if (p.status === "Ditolak")
    return `Halo ${p.nama}, mohon maaf, pendaftaran Anda belum dapat disetujui${
      p.catatan ? ` (${p.catatan})` : ""
    }. Silakan hubungi ketua Kelompok Tani ${p.kelompokTani} untuk perbaikan data.`;

  if (t.includes("dosis") || t.includes("takaran") || t.includes("cara pakai") || t.includes("pemupukan")) {
    const d = edu.dosisAnjuran[p.komoditas];
    return d
      ? `Untuk ${p.komoditas}, anjuran umum: ${d}\n\nTetap sesuaikan dengan kondisi tanah dan rekomendasi penyuluh setempat ya, ${p.nama}.`
      : "Anjuran dosis berbeda tiap komoditas. Sebaiknya konsultasikan dengan penyuluh pertanian (PPL) di wilayah Anda untuk takaran yang tepat.";
  }
  if (t.includes("syarat") || t.includes("daftar")) return "Syarat mendapat pupuk subsidi: " + edu.syaratSubsidi.join(" ");
  if (t.includes("cara") && (t.includes("tebus") || t.includes("beli") || t.includes("ambil")))
    return "Cara menebus pupuk subsidi: " + edu.caraTebus.join(" ");
  if (t.includes("harga") || t.includes("het") || t.includes("bayar"))
    return `Harga Eceran Tertinggi (HET): Urea ${formatRupiah(het.Urea)}/kg, NPK ${formatRupiah(
      het.NPK
    )}/kg, Organik ${formatRupiah(het.Organik)}/kg. Pembayaran tunai di kios resmi, bukan lewat chat ini.`;

  const rincian = p.alokasi.map((a) => `• ${a.jenis}: sisa ${a.sisaKg} kg dari ${a.kuotaKg} kg`).join("\n");
  const habis = p.alokasi.filter((a) => a.sisaKg === 0).map((a) => a.jenis);
  const catatan =
    habis.length > 0
      ? `\n\nCatatan: kuota ${habis.join(" & ")} Anda sudah habis untuk musim ini.`
      : `\n\nTotal sisa yang bisa Anda tebus: ${totalSisa(p)} kg. Bawa KTP asli ke kios resmi (KPL) terdekat ya.`;
  return `Halo ${p.nama} dari ${p.kelompokTani} 🌾\nBerikut sisa kuota pupuk subsidi Anda:\n${rincian}${catatan}`;
}
