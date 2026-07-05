-- ============================================================================
-- MIGRASI 02 — Bersihkan tanda em/en-dash pada teks yang sudah ter-seed.
-- Jalankan di Supabase SQL Editor bila database sudah diisi seed sebelumnya.
-- Aman & idempotent.
-- ============================================================================

update public.edukasi
set isi = 'Tebus sesuai kebutuhan musim tanam, kuota dihitung untuk dua musim, jangan habiskan sekaligus.'
where kategori = 'tips'
  and isi like 'Tebus sesuai kebutuhan musim tanam%';

update public.dosis
set anjuran = 'Urea 200-250 kg/ha + NPK 150 kg/ha. Pupuk dasar saat tanam, susulan umur 21-30 hari.'
where komoditas = 'Padi';

-- Jaring pengaman: ganti sisa em-dash/en-dash yang mungkin ada di teks apa pun.
update public.edukasi set isi     = replace(replace(isi, '—', ', '), '–', '-')     where isi     ~ '[—–]';
update public.dosis   set anjuran = replace(replace(anjuran, '—', ', '), '–', '-') where anjuran ~ '[—–]';
