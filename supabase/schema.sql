-- ============================================================================
-- Kios Tani Digital — Skema Database (Supabase / PostgreSQL)
-- Jalankan di Supabase Dashboard → SQL Editor (atau via `supabase db`).
-- Idempotent: aman dijalankan ulang.
-- ============================================================================

-- Ekstensi UUID (biasanya sudah aktif di Supabase)
create extension if not exists "pgcrypto";

-- ── Master: Harga Eceran Tertinggi per jenis pupuk (Rp/kg) ──────────────────
create table if not exists public.het (
  jenis  text primary key check (jenis in ('Urea', 'NPK', 'Organik')),
  harga  integer not null check (harga >= 0)
);

-- ── Petani penerima subsidi (e-RDKK) ────────────────────────────────────────
create table if not exists public.petani (
  nik           text primary key check (char_length(nik) = 16),
  no_telp       text not null,
  nama          text not null,
  kelompok_tani text not null,
  desa          text not null,
  kecamatan     text not null,
  luas_lahan_ha numeric(4,2) not null check (luas_lahan_ha > 0),
  komoditas     text not null,
  status        text not null default 'Pending'
                  check (status in ('Pending', 'Terdaftar', 'Ditolak')),
  catatan       text,               -- alasan tolak / catatan petugas
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Alokasi kuota pupuk per petani per jenis ────────────────────────────────
create table if not exists public.alokasi (
  id       uuid primary key default gen_random_uuid(),
  nik      text not null references public.petani(nik) on delete cascade,
  jenis    text not null check (jenis in ('Urea', 'NPK', 'Organik')),
  kuota_kg integer not null check (kuota_kg >= 0),
  sisa_kg  integer not null check (sisa_kg >= 0),
  unique (nik, jenis)
);

-- ── Riwayat penebusan (audit trail) ─────────────────────────────────────────
create table if not exists public.transaksi (
  id        text primary key,
  nik       text not null references public.petani(nik) on delete cascade,
  nama      text not null,
  jenis     text not null check (jenis in ('Urea', 'NPK', 'Organik')),
  jumlah_kg integer not null check (jumlah_kg > 0),
  total     integer not null check (total >= 0),
  kios      text not null,
  tanggal   timestamptz not null default now()
);

-- ── Materi edukasi (syarat, cara tebus, tips) ───────────────────────────────
create table if not exists public.edukasi (
  id       bigint generated always as identity primary key,
  kategori text not null check (kategori in ('syarat', 'cara_tebus', 'tips')),
  urutan   integer not null default 0,
  isi      text not null
);

-- ── Anjuran dosis per komoditas ─────────────────────────────────────────────
create table if not exists public.dosis (
  komoditas text primary key,
  anjuran   text not null
);

-- Trigger updated_at untuk petani
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_petani_updated on public.petani;
create trigger trg_petani_updated
  before update on public.petani
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Data operasional (petani/alokasi/transaksi) HANYA diakses server (service role,
-- yang otomatis bypass RLS). Master edukasi/HET boleh dibaca publik (anon).
alter table public.het       enable row level security;
alter table public.petani    enable row level security;
alter table public.alokasi   enable row level security;
alter table public.transaksi enable row level security;
alter table public.edukasi   enable row level security;
alter table public.dosis     enable row level security;

drop policy if exists "het baca publik"     on public.het;
drop policy if exists "edukasi baca publik" on public.edukasi;
drop policy if exists "dosis baca publik"   on public.dosis;

create policy "het baca publik"     on public.het     for select to anon, authenticated using (true);
create policy "edukasi baca publik" on public.edukasi for select to anon, authenticated using (true);
create policy "dosis baca publik"   on public.dosis   for select to anon, authenticated using (true);

-- Indeks bantu
create index if not exists idx_petani_status   on public.petani(status);
create index if not exists idx_petani_no_telp   on public.petani(no_telp);
create index if not exists idx_alokasi_nik      on public.alokasi(nik);
create index if not exists idx_transaksi_tanggal on public.transaksi(tanggal desc);
