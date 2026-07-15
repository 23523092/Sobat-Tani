# Stok Tahunan Pupuk Subsidi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan stok fisik KPL dan kuota petani per tahun, dengan penambahan stok tercatat serta penebusan atomik terhadap kedua saldo.

**Architecture:** PostgreSQL menjadi sumber kebenaran untuk saldo stok, mutasi penerimaan, kuota tahunan, dan transaksi. Server Actions memverifikasi petugas lalu memanggil RPC Supabase untuk operasi yang harus atomik. Query server memfilter alokasi dan statistik ke tahun aktif, sementara riwayat transaksi tetap dapat melihat tahun lama.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Supabase Postgres/RPC, Tailwind CSS, Vitest.

---

## File map

- Create: `supabase/migration_03_stok_tahunan.sql` untuk migrasi tabel, kolom tahun, RPC stok, dan RPC penebusan baru.
- Create: `src/lib/stock.ts` untuk tahun aktif, tipe ringkasan stok, dan validasi angka kg yang dapat diuji tanpa Supabase.
- Create: `src/app/admin/stok/page.tsx` dan `src/app/admin/stok/StokForm.tsx` untuk dashboard stok dan form stok awal/penerimaan.
- Create: `src/app/admin/transaksi/TransaksiFilter.tsx` untuk filter tahun di riwayat.
- Create: `tests/stock.test.ts` dan `vitest.config.ts` untuk perilaku murni terkait stok.
- Modify: `src/lib/data.ts`, `src/lib/queries.ts`, `src/app/admin/actions.ts`, `src/app/admin/page.tsx`, `src/app/admin/tebus/page.tsx`, `src/app/admin/tebus/TebusForm.tsx`, `src/app/admin/transaksi/page.tsx`, `src/components/Sidebar.tsx`, dan `package.json`.

## Task 1: Siapkan pengujian perilaku stok murni

**Files:**
- Create: `tests/stock.test.ts`
- Create: `vitest.config.ts`
- Create: `src/lib/stock.ts`
- Modify: `package.json`

- [ ] **Step 1: Tambahkan test runner dan test gagal terlebih dahulu.**

Tambahkan script `"test": "vitest run"`, pasang Vitest sebagai dev dependency, lalu tulis test untuk `parsePositiveKg`:

```ts
import { describe, expect, it } from "vitest";
import { parsePositiveKg } from "@/lib/stock";

describe("parsePositiveKg", () => {
  it("mengembalikan bilangan bulat positif dari input kg", () => {
    expect(parsePositiveKg("125")).toBe(125);
  });

  it("menolak kosong, nol, negatif, pecahan, dan teks", () => {
    for (const value of ["", "0", "-5", "1.5", "abc"]) {
      expect(parsePositiveKg(value)).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Jalankan test dan pastikan gagal karena helper belum ada.**

Run: `npm test -- tests/stock.test.ts`

Expected: FAIL dengan module/function `@/lib/stock` belum ditemukan.

- [ ] **Step 3: Implementasikan helper minimal.**

`parsePositiveKg` menerima string, hanya menerima digit, mengubahnya ke integer, dan mengembalikan `null` bila hasilnya tidak positif atau bukan finite.

- [ ] **Step 4: Jalankan test sampai lulus.**

Run: `npm test -- tests/stock.test.ts`

Expected: PASS, 2 tests passed.

## Task 2: Tambahkan skema tahunan dan RPC atomik Supabase

**Files:**
- Create: `supabase/migration_03_stok_tahunan.sql`

- [ ] **Step 1: Tulis migration SQL.**

Migration harus:

1. menambahkan `tahun smallint not null default extract(year from now())::smallint` ke `alokasi` dan `transaksi`;
2. mengganti unique lama alokasi `(nik, jenis)` menjadi `(nik, jenis, tahun)`;
3. membuat `stok_tahunan` dengan primary key `(tahun, jenis)` dan saldo non-negatif;
4. membuat `penerimaan_stok` dengan foreign key `(tahun, jenis)` ke `stok_tahunan`;
5. mengaktifkan RLS pada dua tabel baru;
6. membuat RPC `buat_stok_awal` yang menolak duplikasi dan dalam satu transaksi memasukkan stok serta penerimaan awal;
7. membuat RPC `tambah_stok` yang mengunci saldo, menambah `stok_tersedia_kg`, dan menulis `penerimaan_stok` secara atomik;
8. mengganti `tebus_pupuk` agar menerima `p_tahun`, mengunci alokasi dan stok tahun berjalan, memvalidasi keduanya, mengurangi kedua saldo, dan memasukkan `tahun` ke transaksi.

Semua RPC mengembalikan JSON `{ ok: boolean, error?: string }`, menggunakan `security definer`, `set search_path = public`, dan memvalidasi jenis pupuk terhadap tiga jenis yang sudah ada.

- [ ] **Step 2: Periksa SQL secara statis sebelum aplikasi memakainya.**

Run: `git diff --check` dan `rg -n "create table|create or replace function|alter table" supabase/migration_03_stok_tahunan.sql`.

Expected: tidak ada whitespace error dan semua objek migration tercantum.

- [ ] **Step 3: Commit migration secara terpisah.**

Run: `git add supabase/migration_03_stok_tahunan.sql && git commit -m "feat: tambahkan stok tahunan dan rpc atomik"`.

## Task 3: Perbarui tipe, query aktif, dan statistik

**Files:**
- Modify: `src/lib/data.ts`
- Modify: `src/lib/stock.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Tambahkan test gagal untuk ringkasan saldo.**

Tambahkan test `summarizeStok` yang memverifikasi stok tersedia, total keluar, dan persentase penyerapan dihitung dari nilai masuk dan keluar yang diberikan.

- [ ] **Step 2: Implementasikan tipe dan helper.**

Tambahkan `tahun` pada `Alokasi` dan `Transaksi`, lalu tipe `StokTahunan` dan `PenerimaanStok`. Implementasikan `tahunAktif()` memakai timezone `Asia/Jakarta` dan `summarizeStok(stokAwal, masuk, keluar, tersedia)` sebagai helper murni.

- [ ] **Step 3: Filter query alokasi ke tahun aktif.**

Pertahankan query relasi yang ada, tetapi mapper hanya memasukkan `alokasi` dengan `tahun` yang sama dengan argumen tahun. Ubah `getPetaniList`, `getPetaniByStatus`, dan `cariPetani` agar menerima tahun default `tahunAktif()`. Pastikan fungsi publik/asisten tidak menjumlahkan alokasi lintas tahun.

- [ ] **Step 4: Tambahkan query stok dan filter transaksi.**

Tambahkan `getStokTahunan(tahun)`, `getPenerimaanStok(tahun)`, dan `getTransaksi(tahun?)`. Ringkasan stok menggabungkan baris `stok_tahunan`, penerimaan, dan transaksi. Ubah `statistikGlobal(tahun = tahunAktif())` supaya dashboard hanya menghitung tahun aktif.

- [ ] **Step 5: Jalankan test helper dan typecheck.**

Run: `npm test -- tests/stock.test.ts` dan `npx tsc --noEmit`.

Expected: test PASS dan tidak ada error TypeScript.

## Task 4: Tambahkan Server Actions untuk stok dan alokasi tahunan

**Files:**
- Modify: `src/app/admin/actions.ts`

- [ ] **Step 1: Tulis test/kontrak input sebelum action.**

Tambahkan test helper validasi untuk jumlah penerimaan dan pastikan input kosong/negatif tidak diteruskan. Action database tetap diuji melalui RPC dan verifikasi build karena repository belum memiliki test integration Supabase.

- [ ] **Step 2: Implementasikan `buatStokAwal`.**

Action memanggil `requirePetugas`, memakai `tahunAktif()`, memvalidasi jenis dan jumlah dengan `parsePositiveKg`, lalu memanggil RPC `buat_stok_awal`.

- [ ] **Step 3: Implementasikan `tambahStok`.**

Action memvalidasi jenis, jumlah, dan sumber, lalu memanggil RPC `tambah_stok` dengan tahun aktif, jenis, jumlah, sumber, dan catatan. Setelah berhasil, revalidate `/admin`, `/admin/stok`, `/admin/tebus`, dan `/admin/transaksi`.

- [ ] **Step 4: Ubah action approval dan penebusan ke tahun aktif.**

`setujuiPendaftar` tidak boleh menghapus alokasi tahun lama; ia hanya mengganti/upsert alokasi tahun berjalan. `catatTebus` meneruskan `p_tahun` ke RPC baru dan mempertahankan hasil error dari RPC.

- [ ] **Step 5: Jalankan typecheck.**

Run: `npx tsc --noEmit`.

Expected: PASS.

## Task 5: Bangun halaman admin Stok Pupuk

**Files:**
- Create: `src/app/admin/stok/page.tsx`
- Create: `src/app/admin/stok/StokForm.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Buat test validasi form yang gagal.**

Gunakan helper `parsePositiveKg` untuk memastikan form tidak dapat mengirim jumlah selain bilangan bulat positif.

- [ ] **Step 2: Implementasikan server page.**

Page mengambil tahun aktif, ringkasan stok, dan penerimaan terbaru secara paralel. Tampilkan kartu Urea/NPK/Organik dengan stok awal, masuk, keluar, dan tersedia.

- [ ] **Step 3: Implementasikan client form.**

Form memiliki mode “Buat stok awal” dan “Tambah stok”, jenis, jumlah kg, sumber, serta catatan. Tampilkan pesan jika stok tahun/jenis belum dibuat atau jika operasi gagal. Setelah sukses, kosongkan jumlah dan panggil `router.refresh()`.

- [ ] **Step 4: Tambahkan navigasi sidebar dan revalidation.**

Tambahkan `/admin/stok` ke `NAV`, dan pastikan state aktif bekerja pada route tersebut.

- [ ] **Step 5: Jalankan build.**

Run: `npm run build`.

Expected: build Next.js berhasil.

## Task 6: Integrasikan saldo stok ke Catat Tebus dan dashboard

**Files:**
- Modify: `src/app/admin/tebus/page.tsx`
- Modify: `src/app/admin/tebus/TebusForm.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Tulis test untuk kondisi stok tidak cukup.**

Tambahkan test helper yang menunjukkan validasi UI menolak jumlah lebih besar dari `stokTersediaKg`, selain validasi sisa kuota petani.

- [ ] **Step 2: Kirim stok aktif ke form tebus.**

Page memuat stok tahun aktif dan meneruskannya ke `TebusForm`. Form menampilkan sisa kuota petani dan stok KPL untuk jenis terpilih.

- [ ] **Step 3: Perbarui validasi dan pesan penebusan.**

Validasi client memberi umpan balik cepat, sedangkan RPC tetap menjadi sumber kebenaran untuk race condition. Setelah berhasil, refresh memuat saldo terbaru dari database.

- [ ] **Step 4: Ubah dashboard.**

Tampilkan kartu stok fisik tersedia dan penyerapan tahun aktif. Bagian penyerapan per jenis menampilkan kuota petani serta stok gudang secara terpisah.

- [ ] **Step 5: Jalankan test dan build.**

Run: `npm test` dan `npm run build`.

Expected: seluruh test PASS dan build berhasil.

## Task 7: Tambahkan tahun pada riwayat dan verifikasi regresi

**Files:**
- Create: `src/app/admin/transaksi/TransaksiFilter.tsx`
- Modify: `src/app/admin/transaksi/page.tsx`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Implementasikan filter tahun berbasis query string.**

Halaman transaksi membaca `?tahun=YYYY`, mengambil transaksi sesuai tahun bila valid, dan menampilkan tahun pada setiap baris. Filter “Semua tahun” tetap tersedia.

- [ ] **Step 2: Tampilkan ringkasan yang mengikuti filter.**

Total kg dan nilai transaksi harus dihitung dari hasil query yang sedang tampil, bukan dari seluruh tabel ketika tahun dipilih.

- [ ] **Step 3: Jalankan seluruh verifikasi.**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, dan `npm run build`.

Expected: semua command berhasil. Jika `next lint` tidak didukung oleh versi Next yang terpasang, catat hasilnya dan gunakan typecheck/build sebagai verifikasi pengganti.

- [ ] **Step 4: Periksa diff dan status sebelum handoff.**

Run: `git diff --check && git status --short`.

Expected: tidak ada whitespace error dan hanya file fitur stok tahunan yang berubah.

