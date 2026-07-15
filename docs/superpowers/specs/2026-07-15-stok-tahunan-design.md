# Desain Stok Fisik dan Kuota Tahunan Pupuk Subsidi

## Tujuan

Menambahkan pengelolaan stok pupuk per tahun tanpa menghapus riwayat lama, serta memastikan fitur Catat Tebus mengurangi dua hal secara atomik:

1. kuota tahunan petani; dan
2. stok fisik pupuk yang tersedia di KPL.

Admin dapat membuat stok awal setiap tahun dan menambahkan stok ketika ada penerimaan baru. Penambahan stok dicatat sebagai mutasi, bukan dengan menimpa angka secara manual.

## Keputusan desain

Stok fisik dan kuota petani dipisahkan karena keduanya memiliki makna bisnis berbeda. Kuota membatasi hak tebus seorang petani, sedangkan stok membatasi persediaan nyata di KPL.

Tahun aktif menggunakan tahun kalender server saat ini. Data tahun sebelumnya tetap tersimpan dan tidak di-reset atau dihapus. Pada fase pertama, halaman operasional bekerja pada tahun berjalan; riwayat transaksi dan stok dapat ditampilkan per tahun.

Alokasi tahunan petani dibuat sebagai baris baru untuk tahun baru. Alokasi tahun sebelumnya tidak diubah. Saat memulai tahun baru, petugas dapat menyalin alokasi tahun sebelumnya sebagai nilai awal lalu mengubahnya sebelum menerbitkan alokasi. Ini mencegah kuota lama hilang dan tetap memberi ruang untuk perubahan kebijakan.

## Model data

### `stok_tahunan`

Menyimpan saldo stok fisik per jenis pupuk dan tahun.

- `tahun` — smallint, bagian dari primary key.
- `jenis` — Urea, NPK, atau Organik; bagian dari primary key.
- `stok_awal_kg` — stok awal tahun, tidak negatif.
- `stok_tersedia_kg` — saldo berjalan yang dapat ditebus, tidak negatif.
- `created_at`, `updated_at` — timestamp audit.

Satu kombinasi tahun dan jenis hanya boleh memiliki satu baris. `stok_tersedia_kg` dipertahankan untuk locking dan validasi atomik; nilainya harus sama dengan stok awal ditambah penerimaan dikurangi penebusan.

### `penerimaan_stok`

Audit trail untuk setiap penambahan stok.

- `id` — UUID.
- `tahun`, `jenis` — periode dan jenis pupuk.
- `jumlah_kg` — harus lebih besar dari nol.
- `sumber` — nama pemasok, gudang asal, atau keterangan penerimaan.
- `catatan` — opsional.
- `tanggal` — timestamp penerimaan.

Stok awal tahun juga dibuat sebagai penerimaan awal melalui operasi pembuatan tahun, sehingga semua kenaikan stok mempunyai jejak.

### Perubahan `alokasi`

- Tambahkan `tahun`.
- Ubah keunikan menjadi `(nik, jenis, tahun)`.
- `kuota_kg` dan `sisa_kg` tetap dipakai untuk kuota tahunan.

Baris alokasi lama diberi tahun berjalan saat migrasi pertama. Ini adalah baseline migrasi untuk data demo/operasional yang belum memiliki tahun; data historis yang perlu tahun berbeda dapat dikoreksi langsung sebelum sistem tahunan digunakan penuh.

### Perubahan `transaksi`

- Tambahkan `tahun`.
- Setiap transaksi penebusan menyimpan tahun kuota dan stok yang dikurangi.
- ID transaksi tetap memakai format yang ada, dengan tahun transaksi sebagai bagian dari ID.

## Alur data

### Membuat stok awal tahun

Petugas membuka menu Stok Pupuk, memilih tahun berjalan, lalu memasukkan stok awal per jenis. Sistem membuat baris `stok_tahunan` dan mutasi penerimaan awal dalam satu operasi. Jika stok untuk tahun dan jenis tersebut sudah ada, sistem menolak pembuatan ulang agar saldo tidak terduplikasi.

### Menambah stok

Petugas mengisi jenis, jumlah, sumber, dan catatan. Server memverifikasi sesi petugas, mengunci baris `stok_tahunan`, menambahkan jumlah ke `stok_tersedia_kg`, dan menyimpan satu baris `penerimaan_stok` dalam transaksi database yang sama. Operasi bersifat menambah; tidak ada input untuk menimpa saldo tersedia.

### Menyetujui atau menerbitkan alokasi

Saat petugas menyetujui pendaftar, alokasi ditulis untuk tahun berjalan. Data alokasi tahun sebelumnya tidak dihapus. Untuk petani lama, operasi salin alokasi membuat nilai `kuota_kg` dan `sisa_kg` baru pada tahun yang dipilih, lalu petugas dapat mengubah angka sebelum menyimpan.

### Catat Tebus

RPC penebusan diperluas dengan tahun aktif dan melakukan langkah berikut dalam satu transaksi database:

1. validasi petani berstatus Terdaftar;
2. mengunci alokasi petani untuk jenis dan tahun berjalan;
3. mengunci stok tahunan untuk jenis dan tahun berjalan;
4. menolak jika kuota petani atau stok KPL tidak cukup;
5. mengurangi `alokasi.sisa_kg`;
6. mengurangi `stok_tahunan.stok_tersedia_kg`;
7. memasukkan transaksi dengan tahun yang sesuai.

Jika salah satu langkah gagal, seluruh perubahan dibatalkan. Dengan demikian dua petugas yang menebus bersamaan tidak dapat membuat saldo negatif atau menjual stok yang sama dua kali.

### Tahun baru

Tidak ada proses yang mengosongkan tabel atau mengubah `sisa_kg` tahun lalu. Petugas membuat stok awal dan alokasi untuk tahun baru. Dashboard, pencarian kuota, dan form Catat Tebus otomatis memakai tahun berjalan. Riwayat lama tetap bisa dibaca dengan filter tahun.

## Perubahan aplikasi

### Menu admin baru: Stok Pupuk

Sidebar menambahkan menu `/admin/stok` yang menampilkan untuk setiap jenis:

- stok awal;
- total stok masuk;
- total sudah ditebus;
- stok tersedia;
- daftar penerimaan terbaru.

Form “Buat Stok Awal” hanya tersedia jika kombinasi tahun dan jenis belum dibuat. Form “Tambah Stok” selalu membuat mutasi penerimaan baru. Validasi jumlah harus bilangan bulat positif.

### Dashboard

Dashboard mengubah label dan perhitungan agar jelas membedakan:

- kuota yang diterbitkan kepada petani;
- stok fisik tersedia di KPL; dan
- volume penebusan tahun berjalan.

Semua angka operasional difilter ke tahun aktif.

### Data petani dan asisten

Query alokasi harus memfilter tahun aktif. Tanpa filter ini, satu petani akan memiliki beberapa baris jenis pupuk ketika tahun baru dibuat dan sisa kuotanya dapat tampil ganda. Asisten publik tetap hanya menampilkan kuota tahun berjalan.

### Riwayat transaksi

Riwayat mempertahankan semua transaksi. Tambahkan filter tahun dan ringkasan total mengikuti filter tersebut. Tanpa filter, perilaku saat ini tetap menampilkan semua data, tetapi setiap baris memperlihatkan tahunnya.

## Keamanan dan penanganan kesalahan

- Semua operasi mutasi tetap melalui server action dan `requirePetugas`.
- RPC stok dan penebusan menggunakan `security definer`, `search_path` yang eksplisit, dan row lock.
- Penebusan gagal dengan pesan berbeda untuk kuota tidak cukup, stok tidak cukup, petani belum terdaftar, atau stok tahunan belum dibuat.
- Penambahan stok tidak boleh menerima nol, angka negatif, pecahan, atau jenis pupuk di luar daftar.
- Tidak ada saldo yang diubah jika pencatatan audit gagal.
- RLS tetap aktif; tabel operasional hanya dibaca dan ditulis melalui server dengan service role.

## Verifikasi dan kriteria penerimaan

1. Admin dapat membuat stok awal untuk Urea, NPK, dan Organik pada tahun berjalan.
2. Admin dapat menambah stok berkali-kali dan saldo bertambah sesuai total penerimaan.
3. Catat Tebus mengurangi stok fisik, sisa kuota petani, dan membuat transaksi dalam satu operasi.
4. Penebusan ditolak jika stok fisik cukup tetapi kuota petani tidak cukup, dan sebaliknya.
5. Penebusan bersamaan tidak menghasilkan saldo negatif.
6. Membuat tahun baru tidak mengubah saldo, transaksi, atau kuota tahun sebelumnya.
7. Dashboard dan asisten tidak mencampur alokasi lintas tahun.
8. Riwayat dapat menampilkan transaksi tahun lama dan tahun berjalan.
9. Build TypeScript/Next.js berhasil setelah perubahan.

## Di luar cakupan fase ini

- Pengurangan stok karena rusak, retur, atau koreksi manual.
- Multi-gudang atau transfer antar-KPL.
- Persetujuan berjenjang untuk penerimaan stok.
- Rekonsiliasi dengan API eksternal e-RDKK atau i-Pubers.

