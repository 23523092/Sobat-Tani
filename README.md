# 🌾 Kios Tani Digital [Layanan Pupuk Subsidi]

Sistem informasi verifikasi, distribusi & edukasi pupuk subsidi berbasis chatbot.
Petani cukup memasukkan **NIK / nomor telepon** untuk mengecek sisa kuota pupuk
subsidinya, sekaligus mendapat edukasi (syarat, dosis, cara menebus). Dilengkapi
**panel petugas (MIS)** untuk verifikasi pendaftar, mencatat penebusan, dan memantau distribusi.

Mengacu pada skema nyata Indonesia: **e-RDKK** & **i-Pubers** (verifikasi berbasis NIK).

---

## ✨ Fitur

- **Asisten Tani (chatbot)** — `/asisten`
  Cek kuota by NIK/telp + edukasi. Ditenagai **Groq AI** dengan *function calling*
  (AI sendiri yang memverifikasi ke database). Bisa menjawab pertanyaan umum apa pun,
  tetap ramah dalam persona petugas tani. Ada *fallback rule-based* bila API key kosong.
- **Pendaftaran publik** — `/daftar`
  Petani mengajukan diri → masuk antrean **Pending** untuk diverifikasi petugas.
- **Panel Petugas (MIS)** — `/admin` *(butuh login)*
  - **Verifikasi Pendaftar** — setujui (dengan menetapkan alokasi kuota, saran otomatis
    dari luas lahan) / tolak / tinjau ulang.
  - **Data Petani** — cari, filter status, ubah status keanggotaan.
  - **Catat Penebusan** — sisa kuota berkurang & transaksi tersimpan di database.
  - **Ringkasan & Riwayat** — dashboard penyerapan + audit trail.
- **Autentikasi petugas** via **Supabase Auth** (email + password).
- **Nol data hardcoded** — semua data (petani, alokasi, transaksi, HET, edukasi) dari **Supabase**.

## 🛠️ Stack

Next.js 15 (App Router, Server Actions) · React 18 · TypeScript · Tailwind CSS ·
**Supabase** (Postgres + Auth) · Groq (OpenAI-compatible) · lucide-react

---

## 🚀 Menjalankan lokal

```bash
npm install
cp .env.example .env.local      # isi kredensial Supabase + Groq
npm run dev                     # http://localhost:3000
```

## 🗄️ Setup Supabase (wajib untuk data)

1. **Buat project** di https://supabase.com (gratis).
2. **Jalankan skema**: buka *SQL Editor* → tempel isi `supabase/schema.sql` → **Run**.
3. **Isi data demo**: tempel isi `supabase/seed.sql` → **Run**.
4. **Fungsi penebusan atomik**: tempel isi `supabase/migration_01_tebus_rpc.sql` → **Run**
   (wajib—dipakai fitur Catat Penebusan agar anti race condition).
5. **Ambil kredensial**: *Project Settings → API*, lalu isi `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # RAHASIA, server-only
   ```
6. **Buat akun petugas**: *Authentication → Users → Add user* (isi email + password,
   centang *Auto Confirm*). Pakai akun ini untuk login di `/admin/login`.
7. Restart `npm run dev`.

> Tanpa kredensial Supabase, app tetap **build & jalan** tetapi menampilkan
> *empty state* (tidak ada data). Ini disengaja agar tidak ada data yang di-hardcode.

### Mengaktifkan AI (Groq — gratis)

1. Buat key di https://console.groq.com/keys
2. Isi `GROQ_API_KEY` di `.env.local`. Indikator di bawah input chat berubah jadi
   "Ditenagai Groq AI". Tanpa key → mode fallback rule-based.

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub → https://vercel.com/new → import.
2. Tambahkan **semua** Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`).
3. Deploy.

---

## 🧱 Struktur

```
supabase/
├── schema.sql                # DDL: tabel + RLS + trigger
└── seed.sql                  # data demo
src/
├── middleware.ts             # refresh sesi + proteksi /admin
├── app/
│   ├── page.tsx              # Landing (data live)
│   ├── daftar/               # Pendaftaran publik + server action
│   ├── asisten/page.tsx      # Chatbot petani
│   ├── admin/
│   │   ├── layout.tsx        # Sidebar (login tampil tanpa sidebar)
│   │   ├── actions.ts        # Server actions: approve/tolak/tebus/ubah status
│   │   ├── login/            # Halaman login + auth actions
│   │   ├── page.tsx          # Ringkasan
│   │   ├── pendaftar/        # Verifikasi pendaftar (MIS)
│   │   ├── petani/           # Data petani + kelola status
│   │   ├── tebus/            # Catat penebusan
│   │   └── transaksi/        # Audit riwayat
│   └── api/chat/route.ts     # Endpoint: lookup DB + Groq + fallback
├── components/               # Logo, Sidebar
└── lib/
    ├── data.ts               # Tipe + helper murni (tanpa data)
    ├── queries.ts            # Semua read dari Supabase
    ├── groq.ts               # Groq client, system prompt, fallback
    └── supabase/             # client (browser/server/admin) + config
```

## 🔐 Arsitektur data & keamanan

- **Read** (dashboard, chat lookup, landing) memakai *service-role client* di server saja.
- **Mutasi** (approve, tolak, tebus, ubah status) lewat **Server Actions** yang
  memverifikasi sesi petugas dulu (`requirePetugas`).
- **RLS aktif** di semua tabel. Master (HET/edukasi/dosis) boleh dibaca publik;
  data operasional hanya via service role (server).
- Service role key tidak pernah dikirim ke browser.

> ⚠️ Privasi: NIK & data petani bersifat sensitif. Data di sini **fiktif** untuk demo.
> Untuk data asli, terapkan kontrol akses & enkripsi yang sesuai regulasi.

---

Prototipe — data demo. Dibangun sebagai dasar yang bisa langsung dikembangkan ke produksi.
