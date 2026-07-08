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

// ── Pencarian web (untuk pertanyaan real-time / terkini) ──
// Pakai Tavily bila TAVILY_API_KEY tersedia, jika tidak fallback ke DuckDuckGo (tanpa key).
async function cariWeb(query: string): Promise<string> {
  const q = (query || "").trim();
  if (!q) return "TIDAK_ADA_HASIL";

  const key = process.env.TAVILY_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        // Kirim key via header (standar Tavily terbaru) + body (kompat lama).
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          api_key: key,
          query: q,
          max_results: 6,
          include_answer: "advanced",
          search_depth: "advanced",
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const parts: string[] = [];
        if (j.answer) parts.push("JAWABAN RINGKAS: " + j.answer);
        for (const r of j.results ?? []) {
          parts.push(`• ${r.title}: ${String(r.content || "").slice(0, 500)}`);
        }
        if (parts.length) return parts.join("\n").slice(0, 4000);
      }
    } catch {
      /* lanjut ke fallback */
    }
  }

  // Fallback tanpa key: DuckDuckGo Instant Answer
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`
    );
    if (res.ok) {
      const j = await res.json();
      const bits: string[] = [];
      if (j.AbstractText) bits.push(j.AbstractText);
      if (j.Answer) bits.push(String(j.Answer));
      for (const t of j.RelatedTopics ?? []) {
        if (t?.Text) bits.push(t.Text);
      }
      if (bits.length) return bits.join("\n").slice(0, 2500);
    }
  } catch {
    /* abaikan */
  }
  return "TIDAK_ADA_HASIL";
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
  {
    type: "function",
    function: {
      name: "cari_web",
      description:
        "Cari informasi terkini/aktual di internet. WAJIB dipanggil untuk pertanyaan tentang berita, peristiwa terbaru, jadwal, skor pertandingan, cuaca hari ini, harga pasar terbaru, kurs, tanggal, atau apa pun yang butuh data real-time dan bisa berubah seiring waktu. Buat kata kunci pencarian yang ringkas dan spesifik.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Kata kunci pencarian yang ringkas dan spesifik dalam bahasa yang paling relevan.",
          },
        },
        required: ["query"],
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

Fokus utamamu:
1. Memverifikasi petani dan menampilkan SISA kuota pupuk subsidinya (Urea/NPK/Organik dalam kg).
2. Menyelipkan EDUKASI singkat bila relevan: syarat subsidi, cara menebus, dosis pupuk per komoditas, tips kesuburan tanah.
3. Mengingatkan penebusan dilakukan di kios resmi (KPL) dengan membawa KTP asli.

Kamu JUGA boleh membantu pertanyaan umum di luar topik pupuk, misalnya cuaca, hitungan sederhana, tips bertani umum, kesehatan tanaman, harga panen, berita, olahraga, atau sekadar mengobrol ramah. Jawab pertanyaan apa pun dengan jujur dan membantu, layaknya asisten cerdas serbabisa, sambil tetap ramah dan sopan. Jika petani mengarahkan topik ke pupuk subsidi, kembalikan bantuanmu ke sana secara alami.

Informasi terkini: kamu punya alat "cari_web". Untuk pertanyaan apa pun yang menyangkut fakta di dunia nyata yang bisa berubah (berita, jadwal, skor/hasil pertandingan, klasemen, cuaca, harga pasar, kurs, siapa pemenang/juara, peristiwa terkini, dll), kamu WAJIB memanggil "cari_web" DULU sebelum menjawab. DILARANG menjawab fakta seperti ini dari ingatanmu.

ATURAN ANTI-NGARANG (paling penting, tidak bisa ditawar):
- Jawab HANYA berdasarkan isi hasil "cari_web". Setiap angka, nama tim/orang, skor, tanggal, dan daftar harus benar-benar ada di hasil pencarian. Dilarang menambah, melengkapi, atau menebak dari ingatanmu.
- Jika hasil "cari_web" bertuliskan "TIDAK_ADA_HASIL" atau tidak memuat jawaban yang diminta: JANGAN mengarang. Katakan terus terang bahwa kamu belum menemukan data terbaru untuk itu saat ini, dan sarankan petani mengecek sumber resmi. Lebih baik mengaku tidak tahu daripada memberi jawaban salah.
- Jika petani mengoreksi (mis. "bukannya tim itu sudah kalah?"), JANGAN sekadar mengubah-ubah daftar tebakan. Panggil "cari_web" lagi dengan kata kunci yang lebih spesifik, lalu jawab dari hasil baru itu.
- JANGAN PERNAH menyebut "batas pengetahuan", "data hingga tahun X", atau bahwa kamu tidak punya info real-time. Cukup pakai "cari_web".

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
  if (!res.ok) throw new Error("groq " + res.status);
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

    // Loop bertahap: biarkan model memakai tool sampai 3 putaran, mis. cari_web
    // lalu cari lagi bila hasil pertama kurang, atau verifikasi + cari sekaligus.
    const MAX_PUTARAN = 3;
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

        if (nama === "cari_web") {
          const hasil = await cariWeb(String(args.query || ""));
          const kosong = !hasil || hasil === "TIDAK_ADA_HASIL";
          msgs.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              hasil_pencarian: hasil,
              instruksi: kosong
                ? "Pencarian tidak menemukan data. JANGAN mengarang jawaban. Katakan terus terang belum menemukan info terbaru dan sarankan cek sumber resmi."
                : "Jawab HANYA dari hasil di atas. Dilarang menambah angka/nama/fakta yang tidak tertera di sini.",
            }),
          });
          continue;
        }

        // default: verifikasi_petani
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
  } catch {
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
