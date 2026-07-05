-- ============================================================================
-- Kios Tani Digital — Data Seed (demo)
-- Jalankan SETELAH schema.sql. Idempotent (pakai upsert / truncate).
-- Semua data fiktif untuk keperluan demo.
-- ============================================================================

truncate table public.transaksi, public.alokasi, public.petani,
               public.het, public.edukasi, public.dosis restart identity cascade;

-- ── HET (Rp/kg) ─────────────────────────────────────────────────────────────
insert into public.het (jenis, harga) values
  ('Urea', 2250),
  ('NPK', 2300),
  ('Organik', 800);

-- ── Petani ──────────────────────────────────────────────────────────────────
insert into public.petani
  (nik, no_telp, nama, kelompok_tani, desa, kecamatan, luas_lahan_ha, komoditas, status) values
  ('1371042503780001','081267340012','Bujang Salim','Tani Saiyo','Koto Baru','Lubuk Sikaping',1.20,'Padi','Terdaftar'),
  ('1371046612850002','081398220145','Siti Rohana','Bundo Kanduang','Sungai Tarab','Sungai Tarab',0.80,'Jagung','Terdaftar'),
  ('1371041809900003','082145667890','Datuk Marajo','Tani Saiyo','Koto Baru','Lubuk Sikaping',1.80,'Padi','Terdaftar'),
  ('1371040207950004','085277331209','Yusniar','Harapan Baru','Padang Ganting','Padang Ganting',0.50,'Cabai','Terdaftar'),
  ('1371041105880005','081374556622','Khairul Anwar','Maju Bersama','Rambatan','Rambatan',2.00,'Padi','Terdaftar'),
  ('1371042909920006','089612340078','Ramlah','Bundo Kanduang','Sungai Tarab','Sungai Tarab',0.60,'Bawang Merah','Pending'),
  ('1371040704960007','081290551234','Zulkifli','Maju Bersama','Rambatan','Rambatan',1.10,'Jagung','Pending'),
  ('1371041508010008','085388776655','Nurbaya','Harapan Baru','Padang Ganting','Padang Ganting',0.90,'Padi','Pending');

-- ── Alokasi (hanya petani berstatus Terdaftar) ──────────────────────────────
insert into public.alokasi (nik, jenis, kuota_kg, sisa_kg) values
  ('1371042503780001','Urea',240,140),
  ('1371042503780001','NPK',180,180),
  ('1371042503780001','Organik',300,120),
  ('1371046612850002','Urea',160,160),
  ('1371046612850002','NPK',120,60),
  ('1371046612850002','Organik',200,200),
  ('1371041809900003','Urea',360,60),
  ('1371041809900003','NPK',270,90),
  ('1371041809900003','Organik',450,0),
  ('1371040207950004','Urea',100,100),
  ('1371040207950004','NPK',75,75),
  ('1371040207950004','Organik',125,50),
  ('1371041105880005','Urea',400,250),
  ('1371041105880005','NPK',300,300),
  ('1371041105880005','Organik',500,350);

-- ── Transaksi ─────────────────────────────────────────────────────────────--
insert into public.transaksi (id, nik, nama, jenis, jumlah_kg, total, kios, tanggal) values
  ('TRX-2026-0148','1371042503780001','Bujang Salim','Urea',100,225000,'KPL Koto Baru','2026-06-21T09:14:00+07'),
  ('TRX-2026-0151','1371041809900003','Datuk Marajo','Organik',450,360000,'KPL Koto Baru','2026-06-22T10:02:00+07'),
  ('TRX-2026-0153','1371042503780001','Bujang Salim','Organik',180,144000,'KPL Koto Baru','2026-06-24T08:41:00+07'),
  ('TRX-2026-0159','1371046612850002','Siti Rohana','NPK',60,138000,'KPL Sungai Tarab','2026-06-26T13:20:00+07'),
  ('TRX-2026-0162','1371041809900003','Datuk Marajo','Urea',300,675000,'KPL Koto Baru','2026-06-27T11:05:00+07'),
  ('TRX-2026-0167','1371040207950004','Yusniar','Organik',75,60000,'KPL Padang Ganting','2026-06-29T09:58:00+07');

-- ── Edukasi ──────────────────────────────────────────────────────────────---
insert into public.edukasi (kategori, urutan, isi) values
  ('syarat',1,'Terdaftar dalam e-RDKK (Rencana Definitif Kebutuhan Kelompok) lewat kelompok tani.'),
  ('syarat',2,'Mengelola lahan maksimal 2 hektar.'),
  ('syarat',3,'Menanam salah satu dari 10 komoditas: padi, jagung, kedelai, cabai, bawang merah, bawang putih, kopi, tebu, kakao, atau ubi kayu.'),
  ('syarat',4,'Penebusan di Kios Pupuk Lengkap (KPL) resmi dengan menunjukkan KTP asli.'),
  ('cara_tebus',1,'Datang ke kios resmi dan tunjukkan KTP asli.'),
  ('cara_tebus',2,'Petugas memindai NIK untuk membuka data alokasi pupuk Anda.'),
  ('cara_tebus',3,'Tebus sesuai sisa kuota, bayar tunai sesuai HET, lalu tanda tangani bukti transaksi.'),
  ('tips',1,'Gunakan pupuk organik sebagai dasar agar tanah tetap subur dan tidak bergantung penuh pada pupuk kimia.'),
  ('tips',2,'Tebus sesuai kebutuhan musim tanam, kuota dihitung untuk dua musim, jangan habiskan sekaligus.'),
  ('tips',3,'Simpan bukti transaksi sebagai catatan penebusan resmi Anda.');

-- ── Dosis anjuran ────────────────────────────────────────────────────────---
insert into public.dosis (komoditas, anjuran) values
  ('Padi','Urea 200-250 kg/ha + NPK 150 kg/ha. Pupuk dasar saat tanam, susulan umur 21-30 hari.'),
  ('Jagung','Urea 200 kg/ha + NPK 150 kg/ha. Berikan bertahap mengikuti fase pertumbuhan.'),
  ('Cabai','NPK 200 kg/ha dengan pupuk organik sebagai dasar untuk kesuburan tanah jangka panjang.'),
  ('Bawang Merah','NPK 250 kg/ha + Organik 10 ton/ha sebagai dasar. Susulan Urea ringan pada fase vegetatif.');
