# Runbook Operasional & Penanganan Insiden — District 13 (T-68)

Dokumen ini adalah panduan operasional standar (_Standard Operating Procedure / Runbook_) untuk menangani insiden teknis dan kegagalan sistem pada sistem POS District 13, sesuai spesifikasi **SDD Bagian 10 & 11.2 (REQ: SDD 10, SDD 11.2)**.

---

## 📋 Matriks Peran & Eskalasi (Escalation Matrix)

| Peran                 | Tanggung Jawab Operasional                                                                                          | Kontak / Saluran                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Kasir (Cashier)**   | Menjalankan POS offline saat gangguan, lapor ke Store Manager bila terjadi anomali printer/sinkronisasi.            | Interkom Toko / WA Internal      |
| **Store Manager**     | Otorisasi void, penyesuaian stok opname, pairing printer, eskalasi ke Engineer bila server down > 5 menit.          | WhatsApp / Telepon Toko          |
| **DevOps / Engineer** | Eksekusi teknis server, database, Caddy reverse proxy, mitigasi rate limit, investigasi log, dan disaster recovery. | Webhook Discord / PagerDuty      |
| **Pemilik (Owner)**   | Pengambilan keputusan darurat, otorisasi DR penuh, persetujuan biaya ekspansi storage/cloud.                        | Telepon Langsung / Discord Owner |

---

## 🚨 Insiden 1: Server Mati / API Tidak Merespons (Server Down)

### Gejala & Pemicu

- UptimeRobot mendeteksi `GET /health/ready` non-200 OK > 2 kali berturut-turut atau latensi > 2000 ms.
- Bot monitoring mengirim peringatan kritis ke webhook Discord: `SERVER_DOWNTIME_ALERT`.
- Indikator status di pojok kanan atas tablet kasir berubah menjadi oranye/merah (`OFFLINE`).

### Penanggung Jawab (PIC)

- **Fase Darurat Toko**: Kasir & Store Manager.
- **Fase Pemulihan Teknis**: DevOps / Backend Engineer.

### Langkah Penanganan

1. **Langkah Kasir (Operasional Berjalan Terus)**:
   - Jangan panik dan **jangan menutup/me-refresh paksa browser PWA**.
   - Kasir tetap memproses transaksi penjualan seperti biasa menggunakan penyimpanan lokal offline (IndexedDB/RxDB).
   - Cetak struk tetap berfungsi normal via Bluetooth ESC/POS lokal.
   - Untuk pembayaran non-tunai, gunakan QRIS statis tercetak di meja kasir jika dynamic QRIS tidak dapat terbuat.
2. **Langkah DevOps / Engineer**:
   - Periksa status layanan di dashboard Railway atau host:
     ```bash
     # Jika menggunakan Docker Compose lokal:
     docker compose ps
     docker compose logs -f --tail=100 api
     ```
   - Lakukan restart container/service:
     ```bash
     docker compose restart api
     # Atau di Railway CLI:
     railway redeploy
     ```
   - Periksa pemakaian memori (`heapUsed`) dan log error fatal (OOM crash atau unhandled rejection).
   - Jika deployment terbaru mengalami regresi, lakukan rollback cepat ke commit stabil terakhir di dashboard Railway / Git.

### Cara Verifikasi

1. Eksekusi pengecekan endpoint kesiapan:
   ```bash
   curl -i http://localhost:3000/health/ready
   # Output yang diharapkan: HTTP/1.1 200 OK
   # {"status":"ok","database":"connected","reportingDb":"connected",...}
   ```
2. Pastikan latensi respons < 2000 ms.
3. Indikator koneksi di tablet kasir berubah menjadi hijau (`ONLINE`) dan proses sinkronisasi antrean outbox otomatis berjalan.

---

## 💾 Insiden 2: Basis Data Penuh / Kuota Storage Terlampaui (DB Full)

### Gejala & Pemicu

- Log PostgreSQL menghasilkan error: `ERROR: could not extend file ... No space left on device` atau `FATAL: remaining connection slots are reserved`.
- Monitor kesehatan memicu alert `DISK_USAGE_WARNING > 80%`.
- Transaksi penyimpanan di backend gagal dengan kode HTTP 500 / 503.

### Penanggung Jawab (PIC)

- DevOps / Database Administrator & Pemilik (untuk keputusan penambahan kuota).

### Langkah Penanganan

1. **Pemeriksaan Penggunaan Ruang & Koneksi**:
   ```sql
   -- Cek ukuran database dan tabel terbesar:
   SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;

   -- Cek jumlah koneksi aktif:
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
2. **Pemutusan Koneksi Idle / Tergantung**:
   ```sql
   -- Terminasi koneksi idle yang menggantung > 5 menit:
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle in transaction'
     AND state_change < now() - INTERVAL '5 minutes';
   ```
3. **Pembersihan Rutin Darurat**:
   - Jalankan skrip pemeliharaan:
     ```bash
     cd backend && npm run maintenance:nightly
     ```
   - Lakukan `VACUUM ANALYZE` pada tabel transaksi besar untuk mereklamasi ruang penyimpanan mati.
4. **Pengarsipan Log Audit**:
   - Jika kuota 500MB di Supabase hampir penuh, ekspor dan arsipkan data `audit_logs` dan `auth_audit_logs` berusia > 90 hari ke Amazon S3 cold storage.
5. **Eskalasi ke Pemilik**:
   - Jika pertumbuhan data transaksi organik melebihi kapasitas free tier, ajukan upgrade ke Supabase Pro Plan / Dedicated Compute (biaya diotorisasi oleh Pemilik).

### Cara Verifikasi

1. Jalankan query pemeriksaan kapasitas:
   ```sql
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```
   Pastikan total pemakaian database < 80% dari kuota server.
2. Jalankan `GET /health/ready` dan pastikan koneksi primary pool dan reporting pool berstatus `connected`.

---

## 🖨️ Insiden 3: Printer Thermal Bluetooth Tidak Terhubung

### Gejala & Pemicu

- Kasir menekan tombol "Cetak Struk", namun struk tidak keluar.
- Muncul dialog peringatan di PWA: _"Printer thermal Bluetooth tidak terhubung"_.
- Ikon status printer di header POS berwarna abu-abu / merah bertanda silang.

### Penanggung Jawab (PIC)

- Kasir & Store Manager.

### Langkah Penanganan

1. **Pemeriksaan Fisik Printer (EPPOS EP-RPP02)**:
   - Pastikan kabel daya tercolok atau baterai printer terisi (lampu indikator daya berwarna biru/hijau, bukan merah berkedip).
   - Buka penutup kompartemen kertas: pastikan rol kertas thermal 58mm tidak habis dan posisi kertas tidak terbalik (sisi peka panas menghadap ke head cetak).
   - Tutup penutup kertas hingga terdengar bunyi klik.
2. **Siklus Daya (Power Cycle)**:
   - Tekan dan tahan tombol Power printer selama 3 detik untuk mematikan.
   - Tunggu 5 detik, lalu tekan kembali tombol Power untuk menyalakan.
3. **Penyambungan Ulang Web Bluetooth di Tablet**:
   - Di tablet Android/Chrome, pastikan fitur Bluetooth aktif.
   - Pada aplikasi POS District 13, klik ikon **Printer** pada bar navigasi atas.
   - Klik tombol **"Hubungkan Printer"**.
   - Pada dialog browser pencarian perangkat Bluetooth, pilih **`EPPOS`**, **`RPP02`**, atau nama printer Bluetooth toko.
   - Klik **"Pair" / "Sandingkan"**.
4. **Jalur Darurat Cetak**:
   - Jika koneksi Bluetooth tablet bermasalah permanen:
     - Gunakan opsi kirim **Struk Digital (e-Receipt)**: masukkan nomor WhatsApp pelanggan untuk pengiriman rincian transaksi otomatis.
     - Atau gunakan fitur dialog cetak browser sistem Android (Share / Print to PDF / Google Cloud Print).

### Cara Verifikasi

1. Buka menu Pengaturan POS $\to$ bagian Printer $\to$ klik tombol **"Uji Cetak (Test Print)"**.
2. Printer mengeluarkan struk uji cetak 58mm dengan teks jelas, font rapi, logo toko, dan garis pemotong kertas rapi.
3. Ikon status printer pada header kasir berubah menjadi hijau (`TERHUBUNG`).

---

## 🔄 Insiden 4: Sinkronisasi Transaksi Macet (Sync Stuck)

### Gejala & Pemicu

- Indikator antrean offline di header tablet kasir menunjukkan angka transaksi tertunda yang tidak berkurang (> 0 transaksi pending).
- Muncul peringatan di tablet: _"Penjualan belum tersinkron > 4 jam"_ (sesuai aturan OFF-006).
- Indikator tablet kasir berwarna hijau (Online), namun data tidak masuk ke dashboard manajer.

### Penanggung Jawab (PIC)

- Kasir (deteksi & lapor) & DevOps / Backend Engineer (investigasi payload).

### Langkah Penanganan

1. **Langkah Kasir**:
   - Buka halaman browser baru di tablet untuk memverifikasi apakah koneksi internet Wi-Fi toko aktif normal.
   - Di aplikasi POS, buka menu navigasi samping $\to$ klik ikon **Status Sinkronisasi**.
   - Klik tombol **"Sinkronkan Sekarang (Sync Now)"** secara manual.
   - **PENTING**: Jangan membersihkan cache browser / clear browser data tablet, karena transaksi offline tersimpan di IndexedDB browser lokal.
2. **Langkah Engineer (Jika Sinkronisasi Tertolak)**:
   - Periksa respons HTTP dari endpoint `POST /api/v1/sync/events`:
     - **Kasus HTTP 429 (`RATE_LIMITED`)**:
       Batch melebihi batas 50 event atau ada request sync ganda dari perangkat yang sama. Mekanisme exponential backoff PWA akan menunggu secara otomatis (30–60 detik). Biarkan client mengirim ulang sesuai jadwal.
     - **Kasus HTTP 401/403 (Sesi Berakhir)**:
       Minta kasir login ulang untuk memperbarui token autentikasi. Sesi yang diperbarui akan langsung mengeksekusi antrean outbox yang belum terkirim.
     - **Kasus HTTP 400 (Event Rusak / Idempotency Key Terduplikasi)**:
       Periksa log backend: sistem POS District 13 memproses event dengan transaksi atomik dan idempotency key. Jika ada 1 transaksi gagal validasi, transaksi lainnya tetap diproses. Event yang gagal akan diberi tanda `FAILED` di log IndexedDB lokal untuk inspeksi manual.

### Cara Verifikasi

1. Angka pada badge indikator transaksi offline di tablet kasir kembali ke `0`.
2. Buka menu Laporan Penjualan di akun Manager/Owner, pastikan seluruh nomor struk dari kasir telah tercatat dengan status `COMPLETED`.

---

## 📉 Insiden 5: Stok Negatif pada Produk (Negative Stock Anomaly)

### Gejala & Pemicu

- Laporan inventaris menampilkan produk dengan jumlah stok kuantitas < 0.
- Rekonsiliasi pemeliharaan malam mendeteksi selisih antara saldo `inventories.quantity` dan kumulatif `inventory_movements`.
- Kasir melaporkan fisik barang ada di rak, namun sistem memperingatkan stok minus.

### Penanggung Jawab (PIC)

- Store Manager / Supervisor Gudang (audit fisik) & Pemilik (otorisasi penyesuaian).

### Langkah Penanganan

1. **Audit Fisik Segera (Stock Opname Ringkas)**:
   - Store Manager menghitung fisik riil produk yang bersangkutan di rak display dan ruang penyimpanan toko.
2. **Penelusuran Audit Trail Pergerakan Barang**:
   - Buka menu **Mutasi Stok** (`/warehouse/movements`).
   - Filter berdasarkan SKU produk terkait.
   - Cek riwayat pergerakan: apakah ada penjualan tercatat dobel, kesalahan input konversi satuan, atau barang masuk (_restock_) yang belum sempat diinput oleh staf gudang.
3. **Koreksi Transaksi Salah**:
   - Jika terjadi salah input kasir (misal kuantitas terketik 10 padahal pembeli hanya membeli 1):
     - Lakukan **Void Transaksi** dengan otorisasi PIN Manager.
     - Input ulang transaksi penjualan yang benar.
4. **Penyesuaian Stok Resmi (Stock Adjustment)**:
   - Buka menu **Inventaris** $\to$ pilih produk $\to$ klik **"Penyesuaian Stok"**.
   - Masukkan kuantitas fisik hasil hitungan riil.
   - Pilih jenis penyesuaian: `STOCK_OPNAME_DISCREPANCY`.
   - Wajib masukkan catatan penjelasan (misal: _"Penyesuaian hasil audit fisik toko 23 Nov 2026"_).
5. **Jalankan Skrip Rekonsiliasi Sistem**:
   ```bash
   cd backend && npm run maintenance:nightly
   ```

### Cara Verifikasi

1. Buka halaman detail produk di aplikasi POS dan Dashboard Web: pastikan kolom stok menampilkan angka $\ge 0$ yang cocok persis dengan hitungan fisik.
2. Log mutasi mencatat baris baru bertipe `ADJUSTMENT` dengan nama Store Manager sebagai penanggung jawab.

---

## 🌋 Insiden 6: Pemulihan Bencana Penuh (Disaster Recovery)

### Gejala & Pemicu

- Server utama Railway atau Supabase mengalami kerusakan permanen / catastrophic failure.
- Database terhapus atau file database korup fatal.
- Layanan tidak dapat dipulihkan dalam waktu 15 menit melalui restart biasa.

### Target Kebutuhan Sistem

- **RPO (Recovery Point Objective)**: $\le 1$ jam (terjamin oleh backup otomatis terenkripsi per jam di Amazon S3).
- **RTO (Recovery Time Objective)**: $\le 1$ hari (prosedur teruji selesai dalam < 60 menit).

### Penanggung Jawab (PIC)

- DevOps Lead / Backend Engineer (pelaksana teknis) & Pemilik (pemberi instruksi resmi DR).

### Alur Langkah Penanganan (Disaster Recovery Workflow)

1. **Aktivasi Mode Darurat Bencana**:
   - Beri tahu Store Manager bahwa server sedang dalam pemulihan bencana.
   - Seluruh kasir tetap berjualan secara offline penuh. Transaksi tersimpan aman di tablet masing-masing.
2. **Penyediaan Server & Basis Data Baru**:
   - Buat instance PostgreSQL baru di Supabase atau penyedia cloud cadangan.
   - Siapkan connection string baru: `DATABASE_URL="postgres://..."`.
3. **Pengambilan & Dekripsi Cadangan Terakhir dari S3**:
   - Periksa arsip cadangan terakhir di Amazon S3:
     ```bash
     aws s3 ls s3://district-13-db-backups/backups/$(date +%Y-%m-%d)/
     ```
   - Unduh cadangan terenkripsi terbaru:
     ```bash
     aws s3 cp s3://district-13-db-backups/backups/YYYY-MM-DD/district13_backup_LATEST.dump.enc ./restore.dump.enc
     ```
   - Dekripsi arsip menggunakan kunci AES-256 Pemilik:
     ```bash
     openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 100000 \
       -in ./restore.dump.enc \
       -out ./restore.dump \
       -k "$BACKUP_ENCRYPTION_KEY"
     ```
4. **Restorasi Data ke Basis Data Baru**:
   - Eksekusi pemulihan data:
     ```bash
     pg_restore -d "$NEW_DATABASE_URL" --clean --no-owner --no-privileges ./restore.dump
     ```
   - Atau gunakan skrip otomasi yang telah terverifikasi:
     ```bash
     TARGET_DB_URL="$NEW_DATABASE_URL" ./scripts/backup/restore-test.sh ./restore.dump
     ```
5. **Sinkronisasi Skema Terbaru (Drizzle Migrations)**:
   ```bash
   cd backend && npm run db:migrate:run
   ```
6. **Membangun Ulang Ringkasan & Statistik**:
   ```bash
   cd backend && npm run recompute-summaries
   ```
7. **Pembaruan Konfigurasi Lingkungan (Environment Variables)**:
   - Perbarui variabel `DATABASE_URL` pada dashboard hosting backend (Railway).
   - Jalankan deploy ulang container API.
8. **Pembukaan Layanan**:
   - Verifikasi endpoint readiness publik.
   - PWA di tablet kasir akan otomatis mendeteksi server baru dan segera menyinkronkan seluruh antrean transaksi offline yang terjadi selama server mati.

### Cara Verifikasi

1. **Integritas Data Terverifikasi**:
   ```sql
   -- Verifikasi jumlah data tabel inti:
   SELECT count(*) FROM users;
   SELECT count(*) FROM products;
   SELECT count(*) FROM transactions;
   SELECT count(*) FROM shifts;
   ```
2. **Verifikasi Kesiapan Layanan**:
   ```bash
   curl -i https://<domain-api>/health/ready
   # Output: HTTP 200 OK
   ```
3. **Uji Transaksi Nyata**:
   - Buat 1 transaksi uji coba di aplikasi kasir.
   - Pastikan transaksi berhasil tersimpan dan langsung terlihat di Dashboard Manajer.
4. **Catat Waktu Eksekusi (RTO Benchmark)**:
   - Dokumentasikan total waktu pemulihan di berkas `scripts/backup/RESTORE_BENCHMARK.json`.
