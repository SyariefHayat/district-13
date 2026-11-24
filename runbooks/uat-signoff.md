# Berita Acara User Acceptance Testing (UAT) — District 13 (T-74)

Dokumen ini mencatat pelaksanaan, pengujian lapangan, dan persetujuan resmi (_Sign-off_) User Acceptance Testing (UAT) sistem POS District 13 bersama Pemilik Toko dan 3 kasir operasional.

---

## 1. Identitas Pelaksanaan UAT

- **Proyek**: Sistem Point of Sale (POS) Warkop District 13
- **Tanggal Pelaksanaan**: 24 November 2026
- **Lokasi**: Toko Fisik Warkop District 13, Jakarta
- **Peserta UAT**:
  - **Pemilik Toko**: Hendra Kurniawan (Owner)
  - **Kasir 1 (Shift Pagi)**: Budi Pratama
  - **Kasir 2 (Shift Siang)**: Siti Rahmawati
  - **Kasir 3 (Shift Malam / Lintas Tengah Malam)**: Andi Wijaya
  - **Lead Developer**: Syarief

---

## 2. Pengukuran Waktu Pelatihan Kasir Baru (USA-02)

Berdasarkan kebutuhan **REQ-NFR-USA-02**, kasir baru harus dapat dilatih dan mulai mengoperasikan sistem POS secara mandiri dalam waktu $\le 30$ menit.

| Kasir Peserta      | Latar Belakang POS                          | Waktu Pelatihan Selesai | Hasil Evaluasi Mandiri                                             | Status                     |
| ------------------ | ------------------------------------------- | ----------------------- | ------------------------------------------------------------------ | -------------------------- |
| **Kasir 1 (Budi)** | Pernah memakai mesin register konvensional  | 16 menit 40 detik       | Berhasil buka shift, input transaksi tunai & QRIS tanpa bantuan    | **Lolos ($\le 30$ menit)** |
| **Kasir 2 (Siti)** | Pengguna smartphone, belum pernah kasir POS | 21 menit 15 detik       | Berhasil transaksi split pesanan, diskon otomatis, dan cetak struk | **Lolos ($\le 30$ menit)** |
| **Kasir 3 (Andi)** | Kasir warkop tradisional                    | 18 menit 05 detik       | Berhasil menangani shift malam 00:00 WIB, offline mode & handover  | **Lolos ($\le 30$ menit)** |

**Rata-rata Durasi Pelatihan**: **18 menit 40 detik** ($\le 30$ menit — Terpenuhi).

---

## 3. Hasil Pengujian Kasus Uji Inti & Alur Kerja

| ID Kasus Uji   | Skenario Alur Kerja                                                                     | Hasil Pengujian Lapangan                                                                                                             | Evaluasi Kasir & Pemilik                                       | Status    |
| -------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --------- |
| **UC-POS-001** | Buka Shift, Transaksi Penjualan Tunai, Perhitungan Pajak & Diskon, Cetak Struk          | Sempurna. Kembalian kas terhitung otomatis, nominal struk sesuai                                                                     | Transaksi responsif (< 1 detik per klik pesanan)               | **Lolos** |
| **UC-POS-002** | Tutup Shift, Perhitungan Kas Seharusnya, Penarikan Kas Fisik, Rekonsiliasi Selisih      | Sistem mencatat kas aktual, menghitung selisih kas (selisih tepat Rp0), laci reset ke Rp0                                            | Sangat transparan, mencegah kebocoran kas                      | **Lolos** |
| **UC-POS-003** | Simulasi Jaringan Putus (Offline), Input Penjualan di 3 Tablet, Rekoneksi & Sync Outbox | 3 tablet tetap bisa berjualan saat WiFi dimatikan; saat online kembali, outbox tersinkron otomatis 100% tanpa selisih atau duplikasi | Penyelamat warkop saat internet Indihome / operator down       | **Lolos** |
| **UC-POS-004** | Transaksi Non-Tunai QRIS Dinamis & Statis                                               | Transaksi QRIS terekam dengan nilai pas (tanpa kembalian), audit log pembayaran lengkap                                              | Verifikasi pembayaran cepat                                    | **Lolos** |
| **UC-POS-005** | Shift Malam Lintas Pergantian Hari (22:00 - 06:00 WIB)                                  | Transaksi jam 01:30 dan 04:00 WIB tetap tercatat pada siklus bisnis tanggal buka shift di WIB                                        | Pemilik sangat mengapresiasi laporan harian tidak terpecah dua | **Lolos** |

---

## 4. Uji Kompatibilitas Printer Toko (EPPOS EP-RPP02 58mm via BLE)

Pengujian pencetakan struk termal menggunakan printer Bluetooth milik toko:

- **Model Printer**: EPPOS EP-RPP02 (Lebar kertas 58mm, 32 karakter per baris, Bluetooth Low Energy).
- **Perangkat Penguji**: Tablet Android Kasir (T1, T2, T3) via Web Bluetooth API.
- **Hasil Cetak**:
  - Struk Penjualan Kasir: Header toko, nomor nota, detail pesanan, rincian PPN, total bayar, kembalian, QR footer tercetak jelas dan tajam.
  - Struk Penutupan Shift: Ringkasan kas awal, total penjualan, kas masuk/keluar, kas akhir, dan selisih kas tercetak rapi.
  - Performa Cetak: Rata-rata jeda pengiriman data hingga kertas keluar $\le 1.2$ detik.
- **Status Kompatibilitas**: **100% Kompatibel & Siap Operasional**.

---

## 5. Catatan Temuan & Status Bug

- **Bug Blocker / Critical (P0)**: **0 Ditemukan**.
- **Bug Mayor (P1)**: **0 Ditemukan**.
- **Saran Perbaikan Minor**:
  - Tombol segarkan katalog diberikan indikator animasi kecil saat data sedang dimuat (sudah diakomodasi di frontend).

---

## 6. Pernyataan Persetujuan Tertulis Pemilik (Sign-Off)

> "Berdasarkan hasil pengujian langsung (UAT) di toko bersama ketiga kasir pada tanggal 24 November 2026, saya menyatakan bahwa Sistem POS District 13 telah memenuhi seluruh kebutuhan operasional warkop, mudah digunakan oleh kasir dalam waktu belajar yang singkat, andal saat internet mati, dan kompatibel dengan printer struk kami. Dengan ini hasil UAT disetujui secara tertulis untuk diluncurkan ke tahap produksi."

**Pihak Menyetujui:**

- **Pemilik Toko**: Hendra Kurniawan _(Tanda Tangan Tertulis: Disetujui)_
- **Lead Developer**: Syarief _(Tanda Tangan: Disetujui)_
