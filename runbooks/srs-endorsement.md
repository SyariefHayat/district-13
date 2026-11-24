# Berita Acara Konfirmasi Nilai (Usulan) & Pengesahan SRS — District 13 (T-75)

Dokumen ini mendokumentasikan persetujuan final Pemilik atas seluruh nilai bertanda _(usulan)_ pada dokumen **Software Requirements Specification (SRS)** dan penyelarasan spesifikasi sistem sebelum peluncuran resmi.

---

## 1. Konfirmasi Seluruh Nilai Bertanda (Usulan)

Seluruh parameter desain teknis dan operasional yang sebelumnya diajukan sebagai nilai awal pengembang telah ditinjau dan disetujui penuh oleh Pemilik:

| Parameter Kebutuhan                              | Nilai Usulan Awal                  | Nilai yang Disetujui Pemilik                          | Dasar Pertimbangan / Keterangan                                                                   |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Kapasitas Outbox Offline Tablet (OFF-009)**    | 3.000 transaksi / 3 hari offline   | **3.000 transaksi**                                   | Cukup untuk menampung volume transaksi puncak warkop hingga 3 hari tanpa internet.                |
| **Peringatan Shift Terbuka Lama (SHF-013)**      | Durasi > 10 jam                    | **10 jam**                                            | Menghindari kelalaian penutupan shift saat pergantian giliran kerja kasir.                        |
| **Jendela Pemeliharaan Sistem Rutin (REL-09)**   | 03:00 – 04:00 WIB                  | **03:00 – 04:00 WIB**                                 | Jam paling sepi di warkop; toleransi downtime server maks 5 menit tidak mengganggu kasir offline. |
| **Umur Token Autentikasi (SEC-03)**              | Access: 15 menit; Refresh: 14 hari | **Access: 15 menit; Refresh: 14 hari**                | Menjaga keamanan sesi browser kasir sekaligus memudahkan operasional harian tablet.               |
| **Retensi Cadangan Data Basis Data (REL-02)**    | Minimal 30 hari                    | **30 hari** di penyimpanan terpisah S3 / Cold Storage | Memenuhi standar audit kepatuhan dan pemulihan bencana warkop.                                    |
| **Batas Waktu Pelatihan Kasir Baru (USA-02)**    | $\le 30$ menit                     | **$\le 30$ menit**                                    | Terbukti pada UAT tercapai rata-rata 18 menit 40 detik.                                           |
| **Batas Anggaran Operasional Bulanan (COST-01)** | $\le$ Rp 250.000 / bulan           | **$\le$ Rp 250.000 / bulan**                          | Terpenuhi dengan VPS Railway/Docker + Cloudflare Caching.                                         |

---

## 2. Penyelarasan Rujukan & Matriks Izin (RBAC)

1. **Perbaikan Rujukan Silang `OFF-001` $\rightarrow$ `REL-04`**:
   - Seluruh rujukan klausul toleransi durabilitas penyimpanan offline diselaraskan ke `REQ-NFR-REL-04` (penjualan kasir wajib tetap berjalan saat server tidak tersedia).
2. **Penyelarasan Jumlah Izin RBAC (57 Izin)**:
   - Jumlah hak akses diselaraskan secara konsisten pada **57 izin operasional** di seluruh dokumentasi (SRS Bagian 2.2, SDD Bagian 5.3 & Lampiran C, serta skrip migrasi basis data).
3. **Penyelarasan Status Validasi SRS**:
   - Butir daftar periksa Bagian 8: _"Seluruh nilai bertanda (usulan) telah dikonfirmasi pemilik"_ resmi berstatus **`Terpenuhi`**.
   - Butir daftar periksa Bagian 8: _"RTM terisi lengkap (desain, kode, hasil uji)"_ resmi berstatus **`Terpenuhi`**.

---

## 3. Pengesahan Formal Dokumen SRS

Dengan ini dokumen **Software Requirements Specification (SRS) v1.0** disahkan sebagai acuan spesifikasi resmi sistem POS District 13.

- **Status Dokumen**: **Disahkan oleh Pemilik**
- **Tanggal Pengesahan**: 24 November 2026
- **Pihak yang Mengesahkan**:
  - Hendra Kurniawan _(Pemilik Toko)_
  - Syarief _(Lead Engineer)_
