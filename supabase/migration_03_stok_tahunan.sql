-- ============================================================================
-- MIGRASI 03 — Stok fisik KPL dan alokasi kuota per tahun
-- Jalankan setelah schema.sql dan migration_01_tebus_rpc.sql.
-- ============================================================================

-- ── Tambah periode pada alokasi dan transaksi ───────────────────────────────
alter table public.alokasi
  add column if not exists tahun smallint;

update public.alokasi
set tahun = extract(year from now())::smallint
where tahun is null;

alter table public.alokasi
  alter column tahun set default extract(year from now())::smallint,
  alter column tahun set not null;

alter table public.alokasi
  drop constraint if exists alokasi_nik_jenis_key;

create unique index if not exists uq_alokasi_nik_jenis_tahun
  on public.alokasi(nik, jenis, tahun);

alter table public.transaksi
  add column if not exists tahun smallint;

update public.transaksi
set tahun = extract(year from tanggal)::smallint
where tahun is null;

alter table public.transaksi
  alter column tahun set default extract(year from now())::smallint,
  alter column tahun set not null;

create index if not exists idx_alokasi_tahun on public.alokasi(tahun);
create index if not exists idx_transaksi_tahun on public.transaksi(tahun);

-- ── Stok fisik per tahun dan jenis ──────────────────────────────────────────
create table if not exists public.stok_tahunan (
  tahun            smallint not null,
  jenis            text not null check (jenis in ('Urea', 'NPK', 'Organik')),
  stok_awal_kg     integer not null check (stok_awal_kg >= 0),
  stok_tersedia_kg integer not null check (stok_tersedia_kg >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (tahun, jenis)
);

create table if not exists public.penerimaan_stok (
  id        uuid primary key default gen_random_uuid(),
  tahun     smallint not null,
  jenis     text not null check (jenis in ('Urea', 'NPK', 'Organik')),
  jumlah_kg integer not null check (jumlah_kg > 0),
  sumber    text not null default 'Penerimaan stok',
  catatan   text,
  tanggal   timestamptz not null default now(),
  constraint penerimaan_stok_tahun_jenis_fk
    foreign key (tahun, jenis) references public.stok_tahunan(tahun, jenis)
    on delete restrict
);

alter table public.stok_tahunan enable row level security;
alter table public.penerimaan_stok enable row level security;

create index if not exists idx_penerimaan_stok_tanggal
  on public.penerimaan_stok(tanggal desc);
create index if not exists idx_penerimaan_stok_tahun
  on public.penerimaan_stok(tahun, jenis);

drop trigger if exists trg_stok_tahunan_updated on public.stok_tahunan;
create trigger trg_stok_tahunan_updated
  before update on public.stok_tahunan
  for each row execute function public.set_updated_at();

-- ── Buat stok awal tahun ─────────────────────────────────────────────────────
create or replace function public.buat_stok_awal(
  p_tahun   integer,
  p_jenis   text,
  p_jumlah  integer,
  p_sumber  text default 'Stok awal tahun',
  p_catatan text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tahun is null or p_tahun < 2000 or p_tahun > 2100 then
    return jsonb_build_object('ok', false, 'error', 'Tahun stok tidak valid.');
  end if;
  if p_jenis not in ('Urea', 'NPK', 'Organik') then
    return jsonb_build_object('ok', false, 'error', 'Jenis pupuk tidak valid.');
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Jumlah stok awal harus lebih dari 0 kg.');
  end if;
  if exists (
    select 1 from public.stok_tahunan
    where tahun = p_tahun and jenis = p_jenis
  ) then
    return jsonb_build_object('ok', false,
      'error', 'Stok awal ' || p_jenis || ' tahun ' || p_tahun || ' sudah dibuat.');
  end if;

  insert into public.stok_tahunan (tahun, jenis, stok_awal_kg, stok_tersedia_kg)
  values (p_tahun, p_jenis, p_jumlah, p_jumlah);

  insert into public.penerimaan_stok (tahun, jenis, jumlah_kg, sumber, catatan)
  values (
    p_tahun,
    p_jenis,
    p_jumlah,
    coalesce(nullif(trim(p_sumber), ''), 'Stok awal tahun'),
    nullif(trim(p_catatan), '')
  );

  return jsonb_build_object('ok', true);
end $$;

-- ── Tambah stok masuk ───────────────────────────────────────────────────────
create or replace function public.tambah_stok(
  p_tahun   integer,
  p_jenis   text,
  p_jumlah  integer,
  p_sumber  text default 'Penerimaan stok',
  p_catatan text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tersedia integer;
begin
  if p_tahun is null or p_tahun < 2000 or p_tahun > 2100 then
    return jsonb_build_object('ok', false, 'error', 'Tahun stok tidak valid.');
  end if;
  if p_jenis not in ('Urea', 'NPK', 'Organik') then
    return jsonb_build_object('ok', false, 'error', 'Jenis pupuk tidak valid.');
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Jumlah stok masuk harus lebih dari 0 kg.');
  end if;

  select stok_tersedia_kg into v_tersedia
  from public.stok_tahunan
  where tahun = p_tahun and jenis = p_jenis
  for update;

  if not found then
    return jsonb_build_object('ok', false,
      'error', 'Stok awal ' || p_jenis || ' tahun ' || p_tahun || ' belum dibuat.');
  end if;

  update public.stok_tahunan
  set stok_tersedia_kg = v_tersedia + p_jumlah
  where tahun = p_tahun and jenis = p_jenis;

  insert into public.penerimaan_stok (tahun, jenis, jumlah_kg, sumber, catatan)
  values (
    p_tahun,
    p_jenis,
    p_jumlah,
    coalesce(nullif(trim(p_sumber), ''), 'Penerimaan stok'),
    nullif(trim(p_catatan), '')
  );

  return jsonb_build_object('ok', true, 'stokTersediaKg', v_tersedia + p_jumlah);
end $$;

-- ── Penebusan atomik: kuota petani + stok KPL ────────────────────────────────
drop function if exists public.tebus_pupuk(text, text, integer, text);

create or replace function public.tebus_pupuk(
  p_nik    text,
  p_jenis  text,
  p_jumlah integer,
  p_kios   text,
  p_tahun  integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama      text;
  v_status    text;
  v_alok_id   uuid;
  v_sisa      integer;
  v_stok      integer;
  v_harga     integer;
  v_total     integer;
  v_id        text;
begin
  if p_tahun is null or p_tahun < 2000 or p_tahun > 2100 then
    return jsonb_build_object('ok', false, 'error', 'Tahun penebusan tidak valid.');
  end if;
  if p_jenis not in ('Urea', 'NPK', 'Organik') then
    return jsonb_build_object('ok', false, 'error', 'Jenis pupuk tidak valid.');
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Jumlah kg tidak valid.');
  end if;

  select nama, status into v_nama, v_status
  from public.petani
  where nik = p_nik;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Petani tidak ditemukan.');
  end if;
  if v_status <> 'Terdaftar' then
    return jsonb_build_object('ok', false, 'error', 'Petani belum berstatus Terdaftar.');
  end if;

  select id, sisa_kg into v_alok_id, v_sisa
  from public.alokasi
  where nik = p_nik and jenis = p_jenis and tahun = p_tahun
  for update;
  if not found then
    return jsonb_build_object('ok', false,
      'error', 'Petani belum memiliki alokasi ' || p_jenis || ' tahun ' || p_tahun || '.');
  end if;
  if p_jumlah > v_sisa then
    return jsonb_build_object('ok', false,
      'error', 'Melebihi sisa kuota. Sisa ' || p_jenis || ': ' || v_sisa || ' kg.');
  end if;

  select stok_tersedia_kg into v_stok
  from public.stok_tahunan
  where tahun = p_tahun and jenis = p_jenis
  for update;
  if not found then
    return jsonb_build_object('ok', false,
      'error', 'Stok ' || p_jenis || ' tahun ' || p_tahun || ' belum dibuat.');
  end if;
  if p_jumlah > v_stok then
    return jsonb_build_object('ok', false,
      'error', 'Stok KPL tidak cukup. Sisa stok ' || p_jenis || ': ' || v_stok || ' kg.');
  end if;

  select harga into v_harga from public.het where jenis = p_jenis;
  v_harga := coalesce(v_harga, 0);
  v_total := p_jumlah * v_harga;

  update public.alokasi
  set sisa_kg = sisa_kg - p_jumlah
  where id = v_alok_id;

  update public.stok_tahunan
  set stok_tersedia_kg = stok_tersedia_kg - p_jumlah
  where tahun = p_tahun and jenis = p_jenis;

  v_id := 'TRX-' || p_tahun::text || '-' ||
          lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

  insert into public.transaksi (id, nik, nama, jenis, jumlah_kg, total, kios, tahun)
  values (
    v_id,
    p_nik,
    v_nama,
    p_jenis,
    p_jumlah,
    v_total,
    coalesce(nullif(trim(p_kios), ''), 'KPL Pusat'),
    p_tahun
  );

  return jsonb_build_object(
    'ok', true,
    'transaksiId', v_id,
    'total', v_total,
    'stokTersediaKg', v_stok - p_jumlah
  );
end $$;

revoke all on function public.buat_stok_awal(integer, text, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.tambah_stok(integer, text, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.tebus_pupuk(text, text, integer, text, integer)
  from public, anon, authenticated;

grant execute on function public.buat_stok_awal(integer, text, integer, text, text)
  to service_role;
grant execute on function public.tambah_stok(integer, text, integer, text, text)
  to service_role;
grant execute on function public.tebus_pupuk(text, text, integer, text, integer)
  to service_role;
