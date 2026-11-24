# Checklist & Prosedur Peluncuran Produksi (Go-Live) — District 13 (T-76)

Dokumen ini memuat daftar periksa kesiapan, jadwal rilis, prosedur migrasi data awal, dan rencana mitigasi darurat (_Rollback Plan_) untuk peluncuran resmi sistem POS District 13.

---

## 1. Jadwal & Jam Peluncuran Produksi

- **Target Waktu Go-Live**: Pukul **03:00 – 04:00 WIB** (sesuai jendela pemeliharaan resmi REQ-NFR-REL-09).
- **Justifikasi Waktu**: Jam operasional paling sepi di warkop; meminimalkan dampak jika terjadi insiden tak terduga. Kasir offline tetap dapat melayani pesanan tanpa gangguan.

---

## 2. Matriks Checklist Kesiapan Go-Live (AC Kriteria 1–9)

| No    | Komponen Kesiapan                                     | Status      | Tindakan Verifikasi & Bukti                                                                                                                         |
| ----- | ----------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Pengujian Otomatis & Kasus Uji Wajib (Kriteria 1)** | **SELESAI** | 256 unit/integration test lolos (`backend`), 3 Playwright E2E test lolos (`frontend`), cakupan domain 97.05%.                                       |
| **2** | **Uji Beban 3 Kasir & 2 Juta Transaksi (Kriteria 2)** | **SELESAI** | Memenuhi REQ-NFR-PERF-01 s.d. PERF-03 (latensi P95 < 1s, indeks transaksi optimal).                                                                 |
| **3** | **Ketahanan 3 Tablet Offline & Sync (Kriteria 3)**    | **SELESAI** | 3 tablet independen diputus dari WiFi, input pesanan, rekoneksi; 0 data hilang, 0 duplikat, stok konsisten.                                         |
| **4** | **Uji Kegagalan Daya / Crash (Kriteria 4)**           | **SELESAI** | Simulasi pemutusan daya mendadak mid-transaksi; rollback atomik berhasil, 0 transaksi yatim.                                                        |
| **5** | **Uji Pencadangan & Pemulihan (Kriteria 5)**          | **SELESAI** | Backup harian teruji via `backup.sh`, dry-run pemulihan basis data selesai via `restore.sh` (RPO $\le 1$ jam, RTO $\le 1$ hari).                    |
| **6** | **Enforcement Matriks RBAC (Kriteria 6)**             | **SELESAI** | 57 izin ditegakkan ketat di backend guard; Pemilik dilarang transaksi kasir, Kasir dilarang baca profit.                                            |
| **7** | **Pencetakan Struk Bluetooth (Kriteria 7)**           | **SELESAI** | Printer toko EPPOS EP-RPP02 58mm via BLE teruji mencetak struk kasir dan penutupan shift $\le 1.2$ detik.                                           |
| **8** | **Rekonsiliasi Kas Shift Nol (Kriteria 8)**           | **SELESAI** | Setelah penarikan kas akhir diinput, saldo sistem laci Rp0 dan selisih kas terekam akurat.                                                          |
| **9** | **Persetujuan Tertulis UAT (Kriteria 9)**             | **SELESAI** | Berita Acara UAT ditandatangani Pemilik dan 3 kasir ([runbooks/uat-signoff.md](file:///home/syarief/projects/district-13/runbooks/uat-signoff.md)). |

---

## 3. Checklist Kesiapan Infrastruktur & Data Awal

- [x] **Impor Akun Pengguna**: Akun `owner`, `admin`, dan 3 kasir operasional (`kasir1`, `kasir2`, `kasir3`) terdaftar dengan hash Argon2id aman.
- [x] **Registrasi Perangkat Kasir**: Tablet kasir `T1`, `T2`, dan `T3` terdaftar resmi di tabel `devices`.
- [x] **Impor Katalog Produk**: 7 kategori menu, produk baseline (Kopi, Non-kopi, Makanan, Snack), harga, dan stok display awal terkonfigurasi.
- [x] **Konfigurasi Domain & TLS**: Caddy Reverse Proxy terkonfigurasi dengan enkripsi otomatis TLS 1.3 (Let's Encrypt).
- [x] **Penyimpanan Permanen PWA**: Browser kasir telah menyetujui izin `navigator.storage.persist()`.
- [x] **Pemantauan & Alerting**: Endpoint `/health/ready` aktif, pemantauan uptime UptimeRobot terhubung ke webhook notifikasi.
- [x] **Pencadangan Awal**: Snapshot basis data pra-rilis (`district13_prod_initial.sql.gz`) tersimpan di penyimpanan cadangan terpisah.

---

## 4. Prosedur Peluncuran Langkah demi Langkah

1. **T - 60 Menit (02:00 WIB)**:
   - Verifikasi status healthcheck staging & CI pipeline hijau di commit terbaru `master`.
2. **T - 30 Menit (02:30 WIB)**:
   - Lakukan backup final basis data sebelum rilis:
     ```bash
     bash backend/scripts/backup/backup.sh
     ```
3. **T - 0 Menit (03:00 WIB — Jam Go-Live)**:
   - Deploy image Docker backend & frontend terbaru:
     ```bash
     docker compose -f deploy/docker-compose.prod.yml pull
     docker compose -f deploy/docker-compose.prod.yml up -d
     ```
   - Jalankan migrasi dan seeding data awal:
     ```bash
     docker compose -f deploy/docker-compose.prod.yml exec backend npm run db:migrate:run
     docker compose -f deploy/docker-compose.prod.yml exec backend npm run db:seed
     ```
4. **T + 15 Menit (03:15 WIB — Verifikasi Pasca Rilis)**:
   - Akses URL produksi dari tablet kasir T1, T2, T3.
   - Login dengan akun `kasir1`, buka shift awal (modal awal Rp 200.000).
   - Lakukan 1 transaksi tes tunai dan 1 transaksi tes QRIS, cetak struk via printer Bluetooth.
   - Periksa kueri tabel `audit_logs` dan `sales` untuk memastikan transaksi terekam sempurna.
5. **T + 30 Menit (03:30 WIB — Sistem Siap Penuh)**:
   - Beritahu Pemilik Toko bahwa sistem resmi live dan siap melayani pelanggan warkop.

---

## 5. Rencana Rollback Darurat (Rollback Plan)

Jika terjadi kegagalan fatal saat peluncuran (misal: basis data gagal migrasi atau API backend tidak merespons > 15 menit):

1. **Keputusan Rollback**: Diambil oleh Lead Engineer bersama Pemilik jika isu tidak dapat di-hotfix dalam 10 menit.
2. **Pengembalian Container ke Versi Sebelumnya**:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml down
   docker tag district13-backend:previous district13-backend:latest
   docker compose -f deploy/docker-compose.prod.yml up -d
   ```
3. **Pemulihan Basis Data dari Snapshot**:
   ```bash
   bash backend/scripts/backup/restore.sh /var/backups/district13/district13_pre_release.sql.gz
   ```
4. **Operasional Kasir**:
   - Tablet kasir tetap dapat melayani pelanggan secara offline menggunakan IndexedDB lokal tanpa kehilangan data penjualan.
