-- ============================================================================
-- MIGRASI 01 — Fungsi penebusan atomik (anti race condition)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql.
-- Validasi + pengurangan sisa kuota + insert transaksi dilakukan dalam SATU
-- transaksi dengan row lock (FOR UPDATE), jadi tidak mungkin oversell walau
-- dua petugas menebus bersamaan.
-- ============================================================================

create or replace function public.tebus_pupuk(
  p_nik    text,
  p_jenis  text,
  p_jumlah integer,
  p_kios   text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama  text;
  v_status text;
  v_alok_id uuid;
  v_sisa  integer;
  v_harga integer;
  v_total integer;
  v_id    text;
begin
  if p_jumlah is null or p_jumlah <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Jumlah kg tidak valid.');
  end if;

  select nama, status into v_nama, v_status from public.petani where nik = p_nik;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Petani tidak ditemukan.');
  end if;
  if v_status <> 'Terdaftar' then
    return jsonb_build_object('ok', false, 'error', 'Petani belum berstatus Terdaftar.');
  end if;

  -- Kunci baris alokasi sampai transaksi selesai → cegah race condition
  select id, sisa_kg into v_alok_id, v_sisa
    from public.alokasi
    where nik = p_nik and jenis = p_jenis
    for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Petani tidak punya alokasi ' || p_jenis || '.');
  end if;
  if p_jumlah > v_sisa then
    return jsonb_build_object('ok', false,
      'error', 'Melebihi sisa kuota. Sisa ' || p_jenis || ': ' || v_sisa || ' kg.');
  end if;

  select harga into v_harga from public.het where jenis = p_jenis;
  v_harga := coalesce(v_harga, 0);
  v_total := p_jumlah * v_harga;

  update public.alokasi set sisa_kg = sisa_kg - p_jumlah where id = v_alok_id;

  v_id := 'TRX-' || to_char(now(), 'YYYY') || '-' ||
          lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

  insert into public.transaksi (id, nik, nama, jenis, jumlah_kg, total, kios)
  values (v_id, p_nik, v_nama, p_jenis, p_jumlah, v_total,
          coalesce(nullif(trim(p_kios), ''), 'KPL Pusat'));

  return jsonb_build_object('ok', true, 'transaksiId', v_id, 'total', v_total);
end $$;
