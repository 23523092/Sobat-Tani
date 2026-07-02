# 🌾 Kios Tani Digital [Layanan Pupuk Subsidi]

Prototipe sistem informasi verifikasi & edukasi pupuk subsidi berbasis chatbot.
Petani cukup memasukkan **NIK / nomor telepon** untuk mengecek sisa kuota pupuk
subsidinya, sekaligus mendapat edukasi (syarat, dosis, cara menebus). Dilengkapi
**panel petugas** untuk memantau distribusi.

Mengacu pada skema nyata Indonesia: **e-RDKK** & **i-Pubers** (verifikasi berbasis NIK).

---

## ✨ Fitur

- **Asisten Tani (chatbot)** — `/asisten`
  Cek kuota by NIK/telp + edukasi. Ditenagai **Groq AI**, dengan *fallback rule-based*
  cerdas sehingga tetap berfungsi penuh walau API key belum dipasang.
- **Panel Petugas** — `/admin`
  Ringkasan distribusi, penyerapan per jenis pupuk, data petani, dan audit riwayat penebusan.
- **Tema edukasi** menyatu di percakapan (syarat subsidi, dosis per komoditas, HET, tips).

## 🛠️ Stack

Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS · Groq (OpenAI-compatible) · lucide-react

Font: Fraunces (display) + Plus Jakarta Sans (body) + JetBrains Mono (data).

---

## 🚀 Menjalankan lokal

```bash
npm install
cp .env.example .env.local      # isi GROQ_API_KEY (opsional untuk demo)
npm run dev                     # http://localhost:3000
```

> Tanpa `GROQ_API_KEY`, chatbot berjalan dalam **mode fallback** — semua fitur cek
> kuota & edukasi tetap jalan, hanya jawaban kurang luwes dibanding pakai LLM.

### Mengaktifkan AI (Groq — gratis)

1. Buat key di https://console.groq.com/keys
2. Taruh di `.env.local`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxx
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. Restart server. Indikator di bawah input chat berubah jadi "Ditenagai Groq AI".

---

## ☁️ Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Buka https://vercel.com/new → import repo.
3. Di **Environment Variables**, tambahkan `GROQ_API_KEY` (dan `GROQ_MODEL`).
4. Deploy. Selesai — build sudah terverifikasi lulus.

Atau via CLI:
```bash
npm i -g vercel
vercel            # ikuti prompt, login akun sendiri
vercel env add GROQ_API_KEY
vercel --prod
```

---

## 🧱 Struktur

```
src/
├── app/
│   ├── page.tsx              # Landing premium
│   ├── asisten/page.tsx      # Chatbot petani (inti)
│   ├── admin/                # Panel petugas (layout + 3 halaman)
│   └── api/chat/route.ts     # Endpoint: lookup + Groq + fallback
├── components/               # Logo, Sidebar
└── lib/
    ├── data.ts               # DATA DUMMY + helper lookup  ← titik integrasi DB
    └── groq.ts               # Groq client, system prompt, fallback
```

## 🔄 Mengganti data dummy → database asli

Semua data ada di `src/lib/data.ts`. Untuk produksi:

1. Buat tabel di Supabase/PostgreSQL: `petani`, `alokasi_pupuk`, `transaksi`.
2. Ganti fungsi `cariPetani(kunci)` agar query DB by NIK/telp.
3. Sisanya tak perlu diubah — kontrak fungsi tetap sama.

> ⚠️ Catatan privasi: data petani & NIK bersifat sensitif. Versi ini memakai
> **data fiktif**. Jika memakai data asli, terapkan otentikasi, enkripsi, dan
> kontrol akses yang sesuai.

---

Prototipe — data demo fiktif. Dibangun sebagai dasar yang bisa langsung dikembangkan.
