// Auto-generated self-contained GitHub issue & milestone seeder
const milestones = [
  {
    "id": "M0",
    "title": "M0 Fondasi & Spike",
    "description": "Repo, CI, lingkungan, dan uji printer BLE"
  },
  {
    "id": "M1",
    "title": "M1 Database & Inti Backend",
    "description": "Skema lengkap, seed izin, auth, RBAC, audit"
  },
  {
    "id": "M2",
    "title": "M2 Data Master & Admin Dasar",
    "description": "Pengguna, pengaturan, produk, inventaris, UI Admin"
  },
  {
    "id": "M3",
    "title": "M3 Shift & Penjualan Online",
    "description": "Shift, kas, pricing, POST /sales, void"
  },
  {
    "id": "M4",
    "title": "M4 PWA Kasir Offline & Cetak",
    "description": "Local-first, outbox, sync, UI kasir, printer"
  },
  {
    "id": "M5",
    "title": "M5 Laporan, Jadwal & Dasbor",
    "description": "Ringkasan harian, laporan, ekspor, jadwal"
  },
  {
    "id": "M6",
    "title": "M6 NFR, Keamanan & Operasional",
    "description": "Rate limit, backup, pemantauan, beban, restore"
  },
  {
    "id": "M7",
    "title": "M7 Pengujian & Rilis",
    "description": "Integrasi, E2E, fault injection, UAT, go-live"
  }
];
const labels = [
  {
    "name": "type:feature",
    "color": "1D76DB",
    "description": "Fitur baru"
  },
  {
    "name": "type:bug",
    "color": "D73A4A",
    "description": "Perbaikan bug"
  },
  {
    "name": "type:chore",
    "color": "C5DEF5",
    "description": "Tugas pemeliharaan / tooling"
  },
  {
    "name": "type:spike",
    "color": "FBCA04",
    "description": "Eksplorasi / PoC"
  },
  {
    "name": "type:test",
    "color": "0E8A16",
    "description": "Pengujian"
  },
  {
    "name": "type:docs",
    "color": "0075CA",
    "description": "Dokumentasi"
  },
  {
    "name": "mod:INF",
    "color": "5319E7",
    "description": "Modul Infrastruktur"
  },
  {
    "name": "mod:DB",
    "color": "5319E7",
    "description": "Modul Database"
  },
  {
    "name": "mod:SAL",
    "color": "5319E7",
    "description": "Modul Penjualan"
  },
  {
    "name": "mod:OFF",
    "color": "5319E7",
    "description": "Modul Offline & Sync"
  },
  {
    "name": "mod:PRN",
    "color": "5319E7",
    "description": "Modul Printer"
  },
  {
    "name": "mod:PRD",
    "color": "5319E7",
    "description": "Modul Produk"
  },
  {
    "name": "mod:INV",
    "color": "5319E7",
    "description": "Modul Inventaris"
  },
  {
    "name": "mod:USR",
    "color": "5319E7",
    "description": "Modul Pengguna & Auth"
  },
  {
    "name": "mod:SHF",
    "color": "5319E7",
    "description": "Modul Shift"
  },
  {
    "name": "mod:SCH",
    "color": "5319E7",
    "description": "Modul Jadwal"
  },
  {
    "name": "mod:RPT",
    "color": "5319E7",
    "description": "Modul Laporan"
  },
  {
    "name": "mod:SET",
    "color": "5319E7",
    "description": "Modul Pengaturan"
  },
  {
    "name": "mod:NFR",
    "color": "5319E7",
    "description": "Kebutuhan Non-Fungsional"
  },
  {
    "name": "mod:TEST",
    "color": "5319E7",
    "description": "Modul Testing"
  },
  {
    "name": "mod:REL",
    "color": "5319E7",
    "description": "Modul Rilis"
  },
  {
    "name": "area:api",
    "color": "B60205",
    "description": "Backend API"
  },
  {
    "name": "area:pwa-kasir",
    "color": "0E8A16",
    "description": "PWA Layar Kasir"
  },
  {
    "name": "area:pwa-admin",
    "color": "1D76DB",
    "description": "PWA Layar Admin/Pemilik"
  },
  {
    "name": "area:db",
    "color": "0052CC",
    "description": "Database"
  },
  {
    "name": "area:infra",
    "color": "FBCA04",
    "description": "Infrastruktur"
  },
  {
    "name": "P0",
    "color": "B60205",
    "description": "P0 (blocker)"
  },
  {
    "name": "P1",
    "color": "D93F0B",
    "description": "P1 (wajib)"
  },
  {
    "name": "P2",
    "color": "FBCA04",
    "description": "P2 (sebaiknya)"
  },
  {
    "name": "P3",
    "color": "C2E0C6",
    "description": "P3 (dapat)"
  },
  {
    "name": "blocked",
    "color": "000000",
    "description": "Tergantung task lain"
  },
  {
    "name": "needs-owner-confirmation",
    "color": "F9D0C4",
    "description": "Perlu konfirmasi pemilik"
  },
  {
    "name": "srs-change",
    "color": "5319E7",
    "description": "Perubahan dokumen SRS"
  },
  {
    "name": "good-first-test",
    "color": "7057FF",
    "description": "Tes pertama yang baik"
  }
];
const issues = [
  {
    "id": "T-01",
    "title": "[INF] Inisialisasi monorepo dan tooling (T-01)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `P0` · **S** · Depends: —· REQ: MNT-01, MNT-02\n\n- [ ] Struktur `apps/web`, `apps/api`, `packages/shared` (tipe, Zod schema, logika uang)\n- [ ] TypeScript strict, Oxlint, formatter, lockfile dikunci\n- [ ] `README` berisi cara menjalankan lokal\n- **AC:** `lint` dan `typecheck` lolos 0 galat di semua paket"
  },
  {
    "id": "T-02",
    "title": "[INF] Docker Compose untuk pengembangan (T-02)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `P0` · **M** · Depends: T-01 · REQ: SDD 8.2\n\n- [ ] Layanan PostgreSQL + API + Vite dev server\n- [ ] Skrip data contoh sintetis (tanpa data pribadi)\n- [ ] Akses dari tablet lewat jaringan lokal terdokumentasi\n- **AC:** `docker compose up` menjalankan seluruh stack dari repo bersih"
  },
  {
    "id": "T-03",
    "title": "[INF] CI GitHub Actions (T-03)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `P0` · **M** · Depends: T-01 · REQ: MNT-01, MNT-02\n\n- [ ] Workflow: lint, typecheck, unit test (Vitest), `npm audit` (gagal bila ada vuln tinggi/kritis)\n- [ ] Cache dependensi, status check wajib pada branch `main`\n- **AC:** PR dengan galat lint/tipe tidak dapat di-merge"
  },
  {
    "id": "T-04",
    "title": "[INF] Kerangka API NestJS (T-04)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "area:api",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `area:api` `P0` · **M** · Depends: T-01 · REQ: USA-03, SEC-04\n\n- [ ] Prefix `/api/v1`, validasi (class-validator), konfigurasi env tervalidasi\n- [ ] Logger Pino JSON (waktu, level, `req_id`, user, modul) tanpa kata sandi/token\n- [ ] Header `X-Request-Id`, filter galat format standar (SDD 6.7) dengan kode galat yang terdaftar\n- [ ] `GET /health` dan `GET /health/ready`\n- **AC:** semua galat berbentuk `{error:{code,message,details,request_id}}` dan pesan Bahasa Indonesia"
  },
  {
    "id": "T-05",
    "title": "[INF] Kerangka PWA (React 19 + Vite) (T-05)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "area:pwa-kasir",
      "area:pwa-admin",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `area:pwa-kasir` `area:pwa-admin` `P0` · **M** · Depends: T-01 · REQ: USA-04, USA-05, SET-005\n\n- [ ] Tailwind v4, shadcn/ui, React Router, React Hook Form + Zod, TanStack Table\n- [ ] Tiga mode tampilan (Kasir, Admin, Pemilik) dengan layout dan route guard kosong\n- [ ] Helper format Rupiah (bilangan bulat) dan waktu WIB\n- **AC:** seluruh teks UI Bahasa Indonesia; target sentuh tombol ≥ 44 px pada layout Kasir"
  },
  {
    "id": "T-06",
    "title": "[INF] Drizzle ORM dan pipeline migrasi (T-06)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "area:db",
      "P0"
    ],
    "body": "`type:chore` `mod:INF` `area:db` `P0` · **S** · Depends: T-02 · REQ: MNT-03\n\n- [ ] Konfigurasi Drizzle, skrip `migrate` repeatable, migrasi dijalankan di CI\n- **AC:** 100% perubahan skema melalui migrasi berversi"
  },
  {
    "id": "T-07",
    "title": "[INF] Provisioning Vercel, Railway (Caddy), Supabase (T-07)",
    "milestone": "M0",
    "labels": [
      "type:chore",
      "mod:INF",
      "area:infra",
      "P1",
      "needs-owner-confirmation"
    ],
    "body": "`type:chore` `mod:INF` `area:infra` `P1` `needs-owner-confirmation` · **M** · Depends: T-03 · REQ: COST-01, COST-02, SEC-05\n\n- [ ] Proyek Vercel (PWA), Railway (API + Caddy), Supabase (PostgreSQL), variabel lingkungan, secret\n- [ ] Domain dan HTTPS (wajib untuk service worker dan Web Bluetooth)\n- [ ] CD: deploy otomatis `main` ke staging\n- [ ] **Verifikasi harga aktual** semua layanan terhadap batas Rp 250.000 per bulan\n- **AC:** staging dapat diakses dari tablet lewat HTTPS; rincian biaya tercatat dan disetujui pemilik"
  },
  {
    "id": "T-08",
    "title": "[PRN] Spike: uji kompatibilitas printer EPPOS EP-RPP02 via Web Bluetooth (T-08)",
    "milestone": "M0",
    "labels": [
      "type:spike",
      "mod:PRN",
      "P0"
    ],
    "body": "`type:spike` `mod:PRN` `P0` · **S** · Depends: T-05 (halaman uji sederhana) · REQ: SAL-013, A-08, Kriteria 7\n\n- [ ] Halaman uji: pairing BLE GATT dari browser Android, kirim teks dan perintah ESC/POS\n- [ ] Catat service/characteristic UUID, ukuran paket maksimal, hasil cetak\n- [ ] Putusan: **lolos** atau **tidak**; bila tidak, ajukan printer pengganti ke klien\n- **AC:** hasil uji terdokumentasi di issue (foto struk + versi Chrome/Android) sebelum SRS disahkan"
  },
  {
    "id": "T-09",
    "title": "[DB] Migrasi: ekstensi, ENUM, fungsi dasar (T-09)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "area:db",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `area:db` `P0` · **S** · Depends: T-06 · REQ: SDD 5.3 (DDL bagian 1)\n\n- [ ] Ekstensi (mis. trigram/uuid), tipe ENUM, fungsi dasar\n- **AC:** migrasi naik dan turun (kecuali yang destruktif) tanpa galat"
  },
  {
    "id": "T-10",
    "title": "[DB] Migrasi: users, permissions, role_permissions, devices, sessions (T-10)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-09 · REQ: USR-001, USR-003\n\n- [ ] Constraint satu peran per akun, hash kata sandi, status aktif\n- **AC:** skema sesuai DDL SDD bagian 2"
  },
  {
    "id": "T-11",
    "title": "[DB] Migrasi: categories, brands, addons, discounts, products (T-11)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-09 · REQ: PRD-001, PRD-003, PRD-006\n\n- [ ] Indeks unik SKU dan barcode, indeks trigram untuk nama, kolom harga beli/jual\n- **AC:** insert SKU/barcode ganda ditolak di tingkat DB"
  },
  {
    "id": "T-12",
    "title": "[DB] Migrasi: stock dan stock_movements (append-only) (T-12)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-11 · REQ: INV-002, INV-005\n\n- [ ] Stok gudang dan display terpisah; `stock_movements` hanya INSERT\n- [ ] `REVOKE UPDATE, DELETE` dari peran aplikasi + trigger penolak\n- **AC:** UPDATE/DELETE pada `stock_movements` gagal bahkan lewat peran `pos_app`"
  },
  {
    "id": "T-13",
    "title": "[DB] Migrasi: shifts dan cash_entries (T-13)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-10 · REQ: SHF-002, SHF-006, SHF-011\n\n- [ ] Indeks unik parsial: hanya satu shift berstatus terbuka di seluruh toko\n- [ ] Trigger: shift tertutup menolak perubahan dan transaksi baru\n- **AC:** insert shift terbuka kedua ditolak; update shift tertutup ditolak"
  },
  {
    "id": "T-14",
    "title": "[DB] Migrasi: sales, sale_items, sale_item_addons, sale_voids (T-14)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-11, T-13 · REQ: SAL-006, SAL-009, SAL-011, SAL-014\n\n- [ ] PK UUID dari klien (kunci idempotensi), `receipt_no` unik, snapshot harga/SKU/nama/harga beli, mode dan tarif pajak\n- [ ] `sale_voids` merujuk transaksi asal\n- **AC:** transaksi dengan ID sama tidak dapat disimpan dua kali"
  },
  {
    "id": "T-15",
    "title": "[DB] Migrasi: jadwal, pengaturan, antrean, audit, tabel turunan, peran DB (T-15)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-10 · REQ: SCH-004, SET-001, SET-004, REL-08\n\n- [ ] `shift_types`, `schedules`, `store_settings`, `queue_counters`\n- [ ] `audit_logs` append-only dengan kolom tingkat (lengkap/operasional)\n- [ ] `daily_sales_summary`, `daily_product_summary`, `daily_cashier_summary`, `dirty_days`\n- [ ] Peran `pos_app` dengan hak minimum\n- **AC:** audit tidak dapat diubah/dihapus oleh `pos_app`"
  },
  {
    "id": "T-16",
    "title": "[DB] Seed: izin, matriks peran, tipe shift, pengaturan awal, akun Pemilik (T-16)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:DB",
      "P0"
    ],
    "body": "`type:feature` `mod:DB` `P0` · **M** · Depends: T-15 · REQ: USR-003, SCH-004\n\n- [ ] Seed seluruh izin dan matriks Pemilik/Admin/Kasir sesuai SRS 2.2 (**59 izin**, selesaikan selisih dengan SDD yang menyebut 57)\n- [ ] Seed Shift 1 Pagi, Shift 2 Sore, Shift 3 Malam; pengaturan awal; akun Pemilik awal (kata sandi dari env)\n- **AC:** tes membandingkan seed dengan tabel SRS 2.2 sel demi sel"
  },
  {
    "id": "T-17",
    "title": "[USR] Autentikasi: login, refresh, logout, me (T-17)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:USR` `area:api` `P0` · **L** · Depends: T-10, T-04 · REQ: USR-001, USR-004, SEC-01, SEC-03\n\n- [ ] Argon2id, JWT akses 15 menit, refresh token opak ter-hash dan dirotasi, `GET /auth/me` + daftar izin\n- [ ] Kunci akun 5 menit setelah 5 gagal beruntun; tolak akun nonaktif\n- [ ] Kata sandi tidak pernah masuk log\n- **AC:** kode galat `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_ACCOUNT_INACTIVE`, `AUTH_SESSION_EXPIRED` berfungsi"
  },
  {
    "id": "T-18",
    "title": "[USR] Guard RBAC di sisi server (T-18)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:USR` `area:api` `P0` · **M** · Depends: T-16, T-17 · REQ: USR-003, USR-006, SEC-02\n\n- [ ] Dekorator `@RequirePermission(...)`, pemeriksaan `role_permissions`, aturan kepemilikan (\"sendiri\")\n- [ ] Pemilik/Admin ditolak membuka shift dan membuat penjualan walau token valid\n- **AC:** tes matriks: setiap endpoint × peran sesuai SRS 2.2"
  },
  {
    "id": "T-19",
    "title": "[SET] Layanan dan endpoint audit log (T-19)",
    "milestone": "M1",
    "labels": [
      "type:feature",
      "mod:SET",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:SET` `area:api` `P0` · **M** · Depends: T-15, T-18 · REQ: SET-001, SET-002, SEC-04\n\n- [ ] `AuditService.record()` dipanggil dalam transaksi DB yang sama dengan perubahan\n- [ ] `GET /audit-logs` memfilter tingkat otomatis (Pemilik: lengkap, Admin: operasional)\n- **AC:** gagal menulis audit membatalkan perubahan yang diaudit"
  },
  {
    "id": "T-20",
    "title": "[USR] Manajemen pengguna (T-20)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:USR` `area:api` `P1` · **L** · Depends: T-18, T-19 · REQ: USR-002, USR-004, USR-005\n\n- [ ] `GET/POST/PATCH /users`, `deactivate`, `activate`, `reset-password`, `POST /users/me/password`, `DELETE /users/{id}`\n- [ ] Admin hanya boleh membuat/mengubah/reset akun kasir; hapus hanya untuk akun tanpa relasi\n- **AC:** Admin mencoba mengubah akun Admin/Pemilik → `FORBIDDEN`"
  },
  {
    "id": "T-21",
    "title": "[SET] Pengaturan toko, perangkat, dan reset antrean (T-21)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:SET",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:SET` `area:api` `P1` · **M** · Depends: T-19 · REQ: SET-003, SET-004, SET-005\n\n- [ ] `GET/PATCH /settings` (nama, alamat, teks struk, mode dan tarif pajak, stok minimum bawaan), hanya Pemilik yang mengubah\n- [ ] `/devices` (daftar, ubah, nonaktifkan) dan `POST /settings/queue-counter/reset`\n- [ ] Reset antrean otomatis 00:00 WIB; nomor antrean memuat kode perangkat\n- **AC:** perubahan pengaturan tercatat di audit dengan nilai sebelum/sesudah"
  },
  {
    "id": "T-22",
    "title": "[PRD] Kategori dan brand (T-22)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:PRD",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:PRD` `area:api` `P1` · **S** · Depends: T-18 · REQ: PRD-007\n\n- [ ] CRUD `/categories` dan `/brands`\n- **AC:** kasir hanya dapat melihat kategori, tidak mengelola"
  },
  {
    "id": "T-23",
    "title": "[PRD] Produk: CRUD, harga terpisah, nonaktif, ketersediaan (T-23)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:PRD",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:PRD` `area:api` `P1` · **L** · Depends: T-22, T-12 · REQ: PRD-001..005, SAL-010\n\n- [ ] `POST/PATCH /products`; `PATCH /products/{id}/price` khusus Pemilik; `deactivate/activate`; `PATCH /availability`\n- [ ] Baris stok dibuat otomatis saat produk dibuat; produk yang pernah terjual tidak dapat dihapus\n- [ ] Galat `SKU_DUPLICATE` / `BARCODE_DUPLICATE` menyebut produk yang bentrok\n- [ ] `cost_price` disembunyikan pada respons untuk peran Kasir\n- **AC:** perubahan harga tidak mengubah transaksi lama; log audit perubahan harga tercatat"
  },
  {
    "id": "T-24",
    "title": "[PRD] Add-on dan diskon (T-24)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:PRD",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:PRD` `area:api` `P1` · **M** · Depends: T-22 · REQ: PRD-008, SAL-003, SAL-005\n\n- [ ] CRUD `/addons` (harga awal boleh diisi Admin saat membuat; ubah harga via `PATCH /addons/{id}/price` Pemilik), CRUD `/discounts` (nominal/persen, aktif/nonaktif)\n- **AC:** pengelolaan diskon tercatat di audit"
  },
  {
    "id": "T-25",
    "title": "[PRD] Pencarian produk dan impor CSV (T-25)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:PRD",
      "area:api",
      "P2"
    ],
    "body": "`type:feature` `mod:PRD` `area:api` `P2` · **M** · Depends: T-23 · REQ: PRD-006, PRD-009, PERF-02\n\n- [ ] Pencarian nama (trigram), SKU, barcode; target < 1 detik (P95)\n- [ ] `POST /products/import`: maks 5 MB dan 5.000 baris, validasi per baris, kembalikan baris gagal + alasan\n- **AC:** impor sebagian gagal tidak menggagalkan baris valid; daftar gagal bisa diunduh"
  },
  {
    "id": "T-26",
    "title": "[INV] Modul inventaris (T-26)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:INV",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:INV` `area:api` `P1` · **L** · Depends: T-12, T-23 · REQ: INV-001..007, CON-03\n\n- [ ] `POST /inventory/restocks` (Pemilik), `/transfers` (UPDATE bersyarat, tolak bila melebihi stok gudang), `/adjustments` (alasan wajib)\n- [ ] `GET /inventory/dashboard`, `/movements` (append-only), daftar stok minimum\n- [ ] `GET /inventory/review-flags` dan `POST …/{product_id}/resolve`\n- **AC:** saldo stok selalu sama dengan agregat pergerakan; penyesuaian tercatat di audit"
  },
  {
    "id": "T-27",
    "title": "[UI] Login, layout Admin/Pemilik, kunci sesi (T-27)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:pwa-admin",
      "P1"
    ],
    "body": "`type:feature` `mod:USR` `area:pwa-admin` `P1` · **M** · Depends: T-17, T-05 · REQ: USR-007, USA-03\n\n- [ ] Halaman login, penyimpanan token, auto refresh, route guard berbasis izin\n- [ ] Kunci sesi setelah 10 menit tanpa aktivitas (usulan, configurable)\n- **AC:** menu tidak ditampilkan tanpa izin, dan akses langsung ditolak server"
  },
  {
    "id": "T-28",
    "title": "[UI] Halaman pengguna dan pengaturan toko (T-28)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:pwa-admin",
      "P1"
    ],
    "body": "`type:feature` `mod:USR` `area:pwa-admin` `P1` · **M** · Depends: T-20, T-21, T-27 · REQ: USR-002, SET-003\n\n- [ ] Tabel pengguna + form, nonaktifkan/aktifkan, reset kata sandi; form pengaturan toko dan manajemen perangkat\n- **AC:** Admin hanya melihat aksi yang diizinkan untuk akun kasir"
  },
  {
    "id": "T-29",
    "title": "[UI] Halaman produk, kategori, brand, add-on, diskon, impor CSV (T-29)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:PRD",
      "area:pwa-admin",
      "P1"
    ],
    "body": "`type:feature` `mod:PRD` `area:pwa-admin` `P1` · **L** · Depends: T-23, T-24, T-25, T-27 · REQ: PRD-001..009\n\n- [ ] Tabel + form; kolom/aksi harga hanya tampil untuk Pemilik; unggah CSV dan tampilan baris gagal\n- **AC:** pesan bentrok SKU/barcode menyebut produk terkait"
  },
  {
    "id": "T-30",
    "title": "[UI] Halaman inventaris (T-30)",
    "milestone": "M2",
    "labels": [
      "type:feature",
      "mod:INV",
      "area:pwa-admin",
      "P1"
    ],
    "body": "`type:feature` `mod:INV` `area:pwa-admin` `P1` · **L** · Depends: T-26, T-27 · REQ: INV-001..007, OFF-008\n\n- [ ] Dasbor stok gudang/display, stok minimum, riwayat pergerakan, form restock/transfer/penyesuaian, daftar tinjauan stok negatif\n- **AC:** Admin tidak melihat tombol restock"
  },
  {
    "id": "T-31",
    "title": "[SHF] Buka shift dan pembatasan satu shift terbuka (T-31)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SHF",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:SHF` `area:api` `P0` · **M** · Depends: T-13, T-18 · REQ: SHF-001, SHF-002, SHF-009, SHF-011, USR-006\n\n- [ ] `POST /shifts`, `GET /shifts`, `/shifts/{id}`, `/shifts/current`\n- [ ] Modal awal tersimpan sebagai saldo awal (bukan kas masuk); galat `SHIFT_ALREADY_OPEN`\n- **AC:** serah terima berurutan: kasir kedua tidak bisa membuka shift sebelum yang pertama tutup"
  },
  {
    "id": "T-32",
    "title": "[SHF] Kas masuk/keluar (T-32)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SHF",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:SHF` `area:api` `P1` · **M** · Depends: T-31 · REQ: SHF-003, SHF-004\n\n- [ ] `GET/POST /shifts/{id}/cash-entries` (jumlah dan alasan wajib), `PATCH/DELETE /cash-entries/{id}` hanya Pemilik dengan audit\n- **AC:** kasir hanya dapat mencatat di shift sendiri"
  },
  {
    "id": "T-33",
    "title": "[SHF] Tutup shift, selisih kas, dan penarikan kas akhir (T-33)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SHF",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:SHF` `area:api` `P0` · **L** · Depends: T-31, T-32 · REQ: SHF-005..008, SHF-010, UC-POS-002\n\n- [ ] `GET /shifts/{id}/closing-preview` (kas seharusnya = modal awal + penjualan tunai tanpa void + kas masuk − kas keluar)\n- [ ] `POST /shifts/{id}/close`: tolak bila ada keranjang aktif, simpan kas fisik dan selisih, catat penarikan kas akhir otomatis sebagai kas keluar penutupan, kunci shift\n- [ ] `shift.close_any` untuk Pemilik/Admin dengan alasan wajib dan audit\n- **AC:** setelah tutup, saldo laci sistem Rp0 dan selisih tersimpan (Kriteria 8)"
  },
  {
    "id": "T-34",
    "title": "[SHF] Peringatan shift > 10 jam dan batas End of Day (T-34)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SHF",
      "P2",
      "needs-owner-confirmation"
    ],
    "body": "`type:feature` `mod:SHF` `P2` `needs-owner-confirmation` · **S** · Depends: T-31 · REQ: SHF-012, SHF-013\n\n- [ ] Util `businessDate()` WIB (potong 00:00) di paket shared; flag `longOpen` pada `GET /shifts/current`\n- **AC:** End of Day tidak menutup shift berjalan; tes untuk shift melintasi tengah malam"
  },
  {
    "id": "T-35",
    "title": "[SAL] Pustaka perhitungan harga (paket shared) (T-35)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SAL",
      "P0"
    ],
    "body": "`type:feature` `mod:SAL` `P0` · **M** · Depends: T-01 · REQ: SAL-004..007, SAL-005\n\n- [ ] Subtotal item = harga × qty + add-on; diskon nominal/persen dibulatkan ke Rupiah; total tidak < 0\n- [ ] Pajak dua mode (Tambah / Termasuk) dengan pembulatan setengah ke atas; kembalian; tolak uang kurang\n- [ ] Dipakai bersama oleh klien (online/offline) dan server\n- **AC:** tabel uji kasus (kedua mode pajak, diskon > subtotal, bulat/pecah) lolos; cakupan ≥ 80%"
  },
  {
    "id": "T-36",
    "title": "[SAL] `POST /sales`: atomik dan idempoten (T-36)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SAL",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:SAL` `area:api` `P0` · **XL** · Depends: T-14, T-31, T-35, T-26 · REQ: SAL-009, SAL-011, SAL-012, CON-01..04, REL-06\n\n- [ ] Satu transaksi DB: simpan transaksi + baris + add-on + pergerakan stok + kurangi stok display (UPDATE bersyarat)\n- [ ] Periksa shift terbuka (`SHIFT_NOT_OPEN`), stok (`STOCK_INSUFFICIENT` + sisa), uang (`PAYMENT_INSUFFICIENT`); hitung ulang di server, tidak percaya total klien\n- [ ] Idempotensi: kirim ulang → 200 `status: duplicate`; nomor transaksi sama dengan ID berbeda → `RECEIPT_NO_CONFLICT`\n- [ ] Snapshot harga, SKU, nama, harga beli, mode dan tarif pajak\n- **AC:** dua kasir menjual stok terakhir bersamaan → satu sukses, satu ditolak, stok tidak negatif; simpan P95 < 1 detik"
  },
  {
    "id": "T-37",
    "title": "[SAL] Daftar/detail transaksi dan void (T-37)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SAL",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:SAL` `area:api` `P0` · **L** · Depends: T-36 · REQ: SAL-014, INV-005\n\n- [ ] `GET /sales`, `/sales/{id}` (data cetak ulang struk); `POST /sales/{id}/void`\n- [ ] Hanya kasir pemilik, hanya selama shift masih terbuka, alasan wajib (`VOID_NOT_ALLOWED` selain itu)\n- [ ] Void = catatan baru terhubung ke transaksi asal, stok display dikembalikan, tercatat di audit dan pergerakan stok\n- **AC:** void tunai mengurangi kas seharusnya (SHF-005)"
  },
  {
    "id": "T-38",
    "title": "[SAL] Nomor transaksi dan antrean per perangkat (T-38)",
    "milestone": "M3",
    "labels": [
      "type:feature",
      "mod:SAL",
      "mod:SET",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:SAL` `mod:SET` `area:api` `P1` · **M** · Depends: T-21, T-36 · REQ: SAL-011, SET-004\n\n- [ ] Format nomor transaksi `kode-perangkat + tanggal + urutan`; `GET /devices/me/counters` untuk pemulihan penghitung\n- [ ] Nomor antrean terpisah dari ID transaksi dan reset 00:00 WIB\n- **AC:** tidak ada nomor kembar antar perangkat, termasuk saat offline"
  },
  {
    "id": "T-39",
    "title": "[OFF] Setup PWA dan penyimpanan permanen (T-39)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `P0` · **M** · Depends: T-05, T-07 · REQ: OFF-011, AD-02\n\n- [ ] Manifest + service worker (app shell cache), dapat dipasang ke layar utama\n- [ ] `navigator.storage.persist()` dan peringatan bila ditolak\n- **AC:** aplikasi terbuka saat offline setelah kunjungan pertama; peringatan muncul bila persist ditolak"
  },
  {
    "id": "T-40",
    "title": "[OFF] Skema penyimpanan lokal (Dexie / IndexedDB) (T-40)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `P0` · **M** · Depends: T-39 · REQ: OFF-002, OFF-003, OFF-009, SEC-06\n\n- [ ] Store: katalog, harga, diskon, pengaturan, stok display lokal, shift aktif, outbox, kredensial offline ter-hash\n- [ ] Tulis dengan durabilitas ketat; kapasitas ≥ 3.000 penjualan belum tersinkron\n- **AC:** uji simpan 3.000 penjualan tanpa galat penyimpanan"
  },
  {
    "id": "T-41",
    "title": "[OFF] Sinkronisasi katalog dan stok ke tablet (T-41)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `area:api` `P0` · **L** · Depends: T-40, T-23, T-26 · REQ: OFF-002\n\n- [ ] `GET /sync/catalog` berbasis kursor versi (hanya baris berubah): katalog, harga, diskon, pengaturan, stok\n- [ ] Stok display lokal = stok server terbaru + selisih lokal yang belum tersinkron\n- **AC:** perubahan harga oleh Pemilik muncul di tablet otomatis saat online"
  },
  {
    "id": "T-42",
    "title": "[OFF] Deteksi konektivitas (T-42)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `P0` · **M** · Depends: T-39, T-04 · REQ: OFF-001, REL-04\n\n- [ ] Status online berdasarkan ping `/health` dengan batas 3 detik (usulan), bukan hanya event browser\n- [ ] Indikator online/offline di UI; server tidak merespons → jalur offline\n- **AC:** memutus server (bukan hanya Wi-Fi) tetap memindahkan aplikasi ke mode offline"
  },
  {
    "id": "T-43",
    "title": "[USR] Login offline kasir (verifier PBKDF2) (T-43)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:USR",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:USR` `area:pwa-kasir` `P0` · **M** · Depends: T-17, T-40 · REQ: SEC-06, USR-004\n\n- [ ] Setelah login online sukses, turunkan verifier PBKDF2 (WebCrypto, salt unik, iterasi sesuai OWASP) dan simpan; kata sandi tidak pernah disimpan\n- [ ] Login offline memverifikasi terhadap verifier\n- **AC:** inspeksi IndexedDB tidak menemukan teks polos kata sandi"
  },
  {
    "id": "T-44",
    "title": "[UI] Layar penjualan Kasir (T-44)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:SAL",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:SAL` `area:pwa-kasir` `P0` · **XL** · Depends: T-35, T-41, T-05 · REQ: SAL-001..008, SAL-010, USA-01, USA-04\n\n- [ ] Pencarian nama/SKU dan daftar produk; keranjang (ubah qty, hapus item, batalkan keranjang); add-on; pilih diskon\n- [ ] Metode bayar tunai (uang diterima, kembalian) dan non-tunai manual (QRIS/transfer)\n- [ ] Hitung ulang total real-time; tolak qty melebihi stok display dan tampilkan sisa\n- [ ] Tombol ≥ 44 px, pembayaran tunai ≤ 4 langkah layar\n- **AC:** produk muncul di keranjang < 1 detik (P95) dari katalog lokal"
  },
  {
    "id": "T-45",
    "title": "[OFF] Simpan penjualan local-first dan outbox (T-45)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "mod:SAL",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `mod:SAL` `area:pwa-kasir` `P0` · **L** · Depends: T-40, T-44, T-38 · REQ: OFF-003, OFF-007, SAL-011, REL-06, AD-03, AD-04\n\n- [ ] Setiap penjualan ditulis ke IndexedDB (durabilitas ketat) sebelum UI menampilkan sukses; ID transaksi UUID dibuat di klien\n- [ ] Online: tampilkan sukses setelah ack server; offline: setelah tulis lokal berhasil\n- [ ] Kurangi stok display lokal; tolak item bila stok lokal 0; gagal simpan → keranjang dipertahankan dan galat ditampilkan (tidak ada sukses semu)\n- **AC:** tutup paksa aplikasi / matikan tablet setelah konfirmasi → penjualan tetap ada"
  },
  {
    "id": "T-46",
    "title": "[OFF] Mesin sinkronisasi outbox (T-46)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `P0` · **XL** · Depends: T-45, T-47 · REQ: OFF-004, CON-04, UC-POS-003\n\n- [ ] Kirim batch ≤ 50 peristiwa berurutan menurut `seq` perangkat; satu permintaan berjalan per perangkat\n- [ ] Tangani hasil per peristiwa: `accepted`, `duplicate` (dianggap sukses), `rejected` (tampilkan alasan); retry dengan backoff\n- [ ] Pemicu: koneksi pulih, interval, service worker background sync bila tersedia\n- **AC:** pemutusan di tengah pengiriman lalu kirim ulang → tidak ada transaksi ganda, penghitung kembali ke nol"
  },
  {
    "id": "T-47",
    "title": "[OFF] Handler `POST /sync/events` di server (T-47)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:api",
      "P0"
    ],
    "body": "`type:feature` `mod:OFF` `area:api` `P0` · **XL** · Depends: T-33, T-37, T-32 · REQ: OFF-004, OFF-008, CON-04\n\n- [ ] Tipe peristiwa: `shift.open`, `sale.create`, `sale.void`, `cash.record`, `shift.close`; satu peristiwa per transaksi DB, kunci idempotensi\n- [ ] Penjualan offline tidak ditolak karena stok; bila stok display jadi negatif → tandai di daftar tinjauan (OFF-008)\n- [ ] Respons `server_time` dan `clock_skew_seconds`; batas 50 peristiwa per permintaan\n- **AC:** kombinasi duplikat + peristiwa baru dalam satu batch menghasilkan hasil per-`seq` yang benar"
  },
  {
    "id": "T-48",
    "title": "[OFF] UI status sinkronisasi dan pembatasan fungsi offline (T-48)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:OFF",
      "area:pwa-kasir",
      "P1"
    ],
    "body": "`type:feature` `mod:OFF` `area:pwa-kasir` `P1` · **M** · Depends: T-46 · REQ: OFF-005, OFF-006, OFF-010\n\n- [ ] Penghitung penjualan belum tersinkron dan usia tertua; peringatan bila > 4 jam (usulan)\n- [ ] Fungsi online-only (pengguna, produk, harga, inventaris, laporan) ditolak dengan pesan jelas (`OFFLINE_NOT_ALLOWED`)\n- **AC:** peringatan > 4 jam tampil di tablet tanpa koneksi"
  },
  {
    "id": "T-49",
    "title": "[UI] Layar shift, kas, void, riwayat, dan jadwal sendiri (Kasir) (T-49)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:SHF",
      "area:pwa-kasir",
      "P0"
    ],
    "body": "`type:feature` `mod:SHF` `area:pwa-kasir` `P0` · **L** · Depends: T-45, T-33, T-37 · REQ: SHF-001, SHF-003, SHF-005, SHF-007, SHF-013, SAL-012, SAL-014, SCH-002\n\n- [ ] Buka shift (modal awal), kas masuk/keluar, alur tutup shift (kas seharusnya → input kas fisik → selisih → penarikan → kunci)\n- [ ] Tolak tutup bila ada keranjang aktif; peringatan > 10 jam; peringatan bila ada penjualan belum tersinkron\n- [ ] Riwayat transaksi sendiri, void dengan alasan, jadwal sendiri\n- **AC:** seluruh alur bekerja offline dan setelah sinkron datanya sama dengan di server"
  },
  {
    "id": "T-50",
    "title": "[PRN] Implementasi pencetakan struk ESC/POS via Web Bluetooth (T-50)",
    "milestone": "M4",
    "labels": [
      "type:feature",
      "mod:PRN",
      "area:pwa-kasir",
      "P1"
    ],
    "body": "`type:feature` `mod:PRN` `area:pwa-kasir` `P1` · **L** · Depends: T-08, T-44 · REQ: SAL-013, UC-POS-001 E5\n\n- [ ] Pairing awal (aksi pengguna), sambung ulang bila didukung, pecah data sesuai ukuran paket BLE\n- [ ] Layout struk 58 mm (nama toko, alamat, teks struk dari pengaturan, item, add-on, diskon, pajak, total, bayar, kembalian, kasir, nomor)\n- [ ] Printer tidak tersedia → transaksi tetap selesai; tombol cetak ulang dari riwayat\n- **AC:** struk tercetak dari tablet kasir; kegagalan printer tidak membatalkan transaksi"
  },
  {
    "id": "T-51",
    "title": "[SCH] Jadwal staf: API dan UI (T-51)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:SCH",
      "area:api",
      "area:pwa-admin",
      "P2"
    ],
    "body": "`type:feature` `mod:SCH` `area:api` `area:pwa-admin` `P2` · **M** · Depends: T-18, T-27 · REQ: SCH-001..005\n\n- [ ] `GET /shift-types`, `GET /schedules`, `GET /schedules/me`, `POST/PATCH/DELETE /schedules`\n- [ ] Shift Malam (23.00–08.00) disimpan satu entri pada tanggal mulai dan ditampilkan utuh melewati tengah malam\n- [ ] Jadwal bersifat informasi: tidak pernah menolak pembukaan shift\n- **AC:** Kasir hanya melihat jadwal sendiri"
  },
  {
    "id": "T-52",
    "title": "[RPT] Tabel ringkasan harian dan job pembangunan ulang (T-52)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:RPT` `area:api` `P1` · **L** · Depends: T-36, T-37 · REQ: REL-08, RPT-011, PERF-03\n\n- [ ] Isi `daily_*_summary` secara inkremental; tandai `dirty_days` saat ada void atau sinkron terlambat\n- [ ] Skrip `recompute-summaries` yang idempoten dan dapat dibangun ulang dari data kritis\n- **AC:** ringkasan yang dibangun ulang dari nol sama dengan hasil inkremental"
  },
  {
    "id": "T-53",
    "title": "[RPT] API laporan inti dan dasbor (T-53)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:RPT` `area:api` `P1` · **L** · Depends: T-52, T-33, T-26 · REQ: RPT-001..006, RPT-008, RPT-010, RPT-012\n\n- [ ] `/reports/dashboard` (menurut peran; jam ramai hanya Pemilik/Admin), `/sales`, `/products`, `/shifts`, `/cashiers`, `/inventory`, `/cash`, `/cash-entries`\n- [ ] Hari berjalan dihitung langsung dari transaksi; rentang panjang dari tabel ringkasan\n- [ ] Koneksi DB terpisah dan batas waktu pernyataan untuk laporan (PERF-04)\n- **AC:** laporan ≤ 5 detik (P95) pada 2 juta transaksi uji"
  },
  {
    "id": "T-54",
    "title": "[RPT] Laporan khusus Pemilik dan rekonsiliasi (T-54)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:api",
      "P2"
    ],
    "body": "`type:feature` `mod:RPT` `area:api` `P2` · **M** · Depends: T-53 · REQ: RPT-007, RPT-011\n\n- [ ] `/reports/discounts`, `/payment-methods`, `/profit` (harga beli dari snapshot transaksi), hanya Pemilik\n- [ ] `/reports/reconciliation`: total harian (potong 00:00 WIB) dikurangi total semua shift yang dibuka pada tanggal tersebut\n- **AC:** Admin mendapat `FORBIDDEN` pada laporan Pemilik"
  },
  {
    "id": "T-55",
    "title": "[RPT] Ekspor XLSX dan CSV (T-55)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:api",
      "P1"
    ],
    "body": "`type:feature` `mod:RPT` `area:api` `P1` · **M** · Depends: T-53 · REQ: RPT-009\n\n- [ ] `GET /reports/{jenis}/export?format=xlsx|csv` (ExcelJS streaming), izin mengikuti laporan terkait\n- [ ] Batas: 1 ekspor berjalan per pengguna, rentang maks 92 hari per berkas\n- **AC:** ekspor besar tidak melonjakkan memori dan tidak mengganggu simpan transaksi"
  },
  {
    "id": "T-56",
    "title": "[UI] Dasbor dan grafik jam ramai (T-56)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:pwa-admin",
      "area:pwa-kasir",
      "P2"
    ],
    "body": "`type:feature` `mod:RPT` `area:pwa-admin` `area:pwa-kasir` `P2` · **M** · Depends: T-53, T-27 · REQ: RPT-008, RPT-010, RPT-012\n\n- [ ] Dasbor Pemilik/Admin dengan Recharts (jam ramai); dasbor Kasir hanya ringkasan shift sendiri\n- **AC:** Kasir tidak melihat grafik jam ramai maupun data kasir lain"
  },
  {
    "id": "T-57",
    "title": "[UI] Halaman laporan dan tombol ekspor (T-57)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:RPT",
      "area:pwa-admin",
      "P1"
    ],
    "body": "`type:feature` `mod:RPT` `area:pwa-admin` `P1` · **L** · Depends: T-53, T-54, T-55, T-27 · REQ: RPT-001..009\n\n- [ ] Filter rentang tanggal/kasir/produk/shift, tabel (TanStack Table), tombol ekspor, catatan rekonsiliasi harian vs shift\n- **AC:** menu laporan menyesuaikan izin peran"
  },
  {
    "id": "T-58",
    "title": "[UI] Halaman log audit (T-58)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:SET",
      "area:pwa-admin",
      "P2"
    ],
    "body": "`type:feature` `mod:SET` `area:pwa-admin` `P2` · **S** · Depends: T-19, T-27 · REQ: SET-001, SET-002\n\n- [ ] Daftar log dengan filter; Pemilik lengkap, Admin operasional; nilai sebelum/sesudah\n- **AC:** log tidak punya aksi ubah/hapus di UI"
  },
  {
    "id": "T-59",
    "title": "[UI] Halaman jadwal staf (Admin/Pemilik) (T-59)",
    "milestone": "M5",
    "labels": [
      "type:feature",
      "mod:SCH",
      "area:pwa-admin",
      "P2"
    ],
    "body": "`type:feature` `mod:SCH` `area:pwa-admin` `P2` · **M** · Depends: T-51 · REQ: SCH-001, SCH-002, SCH-004, SCH-005\n\n- [ ] Kalender/tabel jadwal, pilihan tiga shift paten, tampilan Shift Malam melintasi tengah malam\n- **AC:** Shift Malam tampil sebagai satu blok utuh"
  },
  {
    "id": "T-60",
    "title": "[NFR] Caddy: rate limiting, header keamanan, batas payload (T-60)",
    "milestone": "M6",
    "labels": [
      "type:chore",
      "mod:NFR",
      "area:infra",
      "P1"
    ],
    "body": "`type:chore` `mod:NFR` `area:infra` `P1` · **M** · Depends: T-07 · REQ: SEC-05, SDD 6.6\n\n- [ ] Gzip/Brotli, CSP, HSTS, batas ukuran payload, batas 300 permintaan/menit/IP\n- [ ] Batas aplikasi: login (per akun + per IP), `/sync/events` (≤ 50 peristiwa, 1 berjalan per perangkat), ekspor, impor\n- **AC:** melebihi batas → `RATE_LIMITED` (429)"
  },
  {
    "id": "T-61",
    "title": "[NFR] Isolasi beban laporan (T-61)",
    "milestone": "M6",
    "labels": [
      "type:chore",
      "mod:NFR",
      "area:api",
      "P1"
    ],
    "body": "`type:chore` `mod:NFR` `area:api` `P1` · **S** · Depends: T-53 · REQ: PERF-04\n\n- [ ] Pool koneksi laporan terpisah, `statement_timeout`, uji simpan transaksi saat laporan berjalan\n- **AC:** P95 simpan transaksi tetap < 1 detik saat laporan dan ekspor berjalan"
  },
  {
    "id": "T-62",
    "title": "[NFR] Pencadangan otomatis per jam ke S3 (T-62)",
    "milestone": "M6",
    "labels": [
      "type:feature",
      "mod:NFR",
      "area:infra",
      "P0"
    ],
    "body": "`type:feature` `mod:NFR` `area:infra` `P0` · **L** · Depends: T-07 · REQ: REL-02, REL-07, AD-07\n\n- [ ] GitHub Actions cron setiap jam: `pg_dump` → enkripsi → unggah ke S3 di luar Supabase; retensi ≥ 30 hari\n- [ ] Verifikasi harian otomatis; notifikasi Discord bila gagal atau terlambat\n- [ ] Putuskan PITR/WAL vs `pg_dump` saja dengan memeriksa batas biaya (lihat catatan 3)\n- **AC:** gagal cadangan memicu peringatan ke Pemilik; RPO ≤ 1 jam terbukti"
  },
  {
    "id": "T-63",
    "title": "[NFR] Pemeliharaan rutin 03.00–04.00 WIB (T-63)",
    "milestone": "M6",
    "labels": [
      "type:chore",
      "mod:NFR",
      "area:infra",
      "P2"
    ],
    "body": "`type:chore` `mod:NFR` `area:infra` `P2` · **M** · Depends: T-52, T-26 · REQ: REL-09\n\n- [ ] `VACUUM ANALYZE`, bangun ulang ringkasan `dirty_days`, rekonsiliasi saldo stok vs pergerakan; gangguan server ≤ 5 menit\n- **AC:** kasir tetap dapat berjualan offline selama jendela pemeliharaan"
  },
  {
    "id": "T-64",
    "title": "[NFR] Pemantauan dan peringatan (T-64)",
    "milestone": "M6",
    "labels": [
      "type:chore",
      "mod:NFR",
      "area:infra",
      "P1"
    ],
    "body": "`type:chore` `mod:NFR` `area:infra` `P1` · **M** · Depends: T-04, T-07 · REQ: REL-05, REL-07, SDD 8.4, 10\n\n- [ ] UptimeRobot `/health/ready` tiap 5 menit (non-200 > 2 kali atau latensi > 2000 ms) → webhook Discord\n- [ ] Sentry untuk API dan PWA tanpa PII; peringatan: sertifikat, cadangan, disk > 80%, lonjakan 5xx, lonjakan login gagal\n- **AC:** simulasi server mati memicu peringatan dalam ≤ 10 menit"
  },
  {
    "id": "T-65",
    "title": "[NFR] Pengerasan keamanan dan pemindaian (T-65)",
    "milestone": "M6",
    "labels": [
      "type:test",
      "mod:NFR",
      "P1"
    ],
    "body": "`type:test` `mod:NFR` `P1` · **M** · Depends: T-60, T-18 · REQ: SEC-01..06, Kriteria 6\n\n- [ ] OWASP ZAP baseline, uji login dan endpoint sensitif, tinjau log (tanpa kata sandi/token), pastikan TLS ≥ 1.2\n- **AC:** 0 temuan tinggi/kritis yang belum ditangani"
  },
  {
    "id": "T-66",
    "title": "[NFR] Data uji 2 juta transaksi dan uji beban k6 (T-66)",
    "milestone": "M6",
    "labels": [
      "type:test",
      "mod:NFR",
      "P0"
    ],
    "body": "`type:test` `mod:NFR` `P0` · **L** · Depends: T-36, T-53 · REQ: PERF-01..04, SCALE-01, SCALE-02\n\n- [ ] Generator data sintetis 2 juta transaksi; skenario k6: 3 kasir + laporan bersamaan\n- [ ] Tuning indeks dan kueri bila target belum tercapai\n- **AC:** P95 simpan < 1 detik, pencarian < 1 detik, laporan ≤ 5 detik (target 2 detik)"
  },
  {
    "id": "T-67",
    "title": "[NFR] Uji pemulihan dari cadangan (T-67)",
    "milestone": "M6",
    "labels": [
      "type:test",
      "mod:NFR",
      "P0"
    ],
    "body": "`type:test` `mod:NFR` `P0` · **L** · Depends: T-62 · REQ: REL-02, REL-03, Kriteria 5\n\n- [ ] Pulihkan cadangan ke server baru, verifikasi data, ukur waktu (RTO ≤ 1 hari)\n- **AC:** berhasil minimal satu kali sebelum peluncuran; waktu tercatat"
  },
  {
    "id": "T-68",
    "title": "[DOC] Runbook operasional (T-68)",
    "milestone": "M6",
    "labels": [
      "type:docs",
      "mod:NFR",
      "P1"
    ],
    "body": "`type:docs` `mod:NFR` `P1` · **M** · Depends: T-62, T-64 · REQ: SDD 10, 11.2\n\n- [ ] Prosedur: server mati, DB penuh, printer tidak terhubung, sinkronisasi macet, stok negatif, pemulihan bencana\n- **AC:** setiap insiden punya langkah, penanggung jawab, dan cara verifikasi"
  },
  {
    "id": "T-69",
    "title": "[TEST] Tes unit logika domain ≥ 80% (T-69)",
    "milestone": "M7",
    "labels": [
      "type:test",
      "mod:TEST",
      "P1"
    ],
    "body": "`type:test` `mod:TEST` `P1` · **M** · Depends: T-35, T-34 · REQ: MNT-04\n\n- [ ] Harga, pajak (kedua mode), kembalian, kas seharusnya/selisih, End of Day, shift lintas tengah malam, aturan sinkron\n- **AC:** laporan cakupan ≥ 80% baris pada modul domain di CI"
  },
  {
    "id": "T-70",
    "title": "[TEST] Tes integrasi (Testcontainers) (T-70)",
    "milestone": "M7",
    "labels": [
      "type:test",
      "mod:TEST",
      "P0"
    ],
    "body": "`type:test` `mod:TEST` `P0` · **L** · Depends: T-36, T-47, T-18 · REQ: CON-01..04, SEC-02, INV-005, SHF-002\n\n- [ ] Atomisitas penjualan–stok, idempotensi, rebutan stok terakhir paralel, indeks unik shift, tabel append-only, matriks izin\n- **AC:** seluruh tes lolos di CI dengan PostgreSQL nyata"
  },
  {
    "id": "T-71",
    "title": "[TEST] E2E Playwright UC-POS-001/002/003 (T-71)",
    "milestone": "M7",
    "labels": [
      "type:test",
      "mod:TEST",
      "P1"
    ],
    "body": "`type:test` `mod:TEST` `P1` · **L** · Depends: T-49, T-50 · REQ: UC-POS-001..003, OFF-001..011\n\n- [ ] Skenario buat penjualan, tutup shift, jual offline lalu sinkron (mode offline Playwright)\n- **AC:** alur inti hijau di CI"
  },
  {
    "id": "T-72",
    "title": "[TEST] Uji kegagalan (fault injection) dan uji 3 tablet (T-72)",
    "milestone": "M7",
    "labels": [
      "type:test",
      "mod:TEST",
      "P0"
    ],
    "body": "`type:test` `mod:TEST` `P0` · **M** · Depends: T-46, T-47 · REQ: REL-01, OFF-009, Kriteria 3, Kriteria 4\n\n- [ ] Tutup paksa aplikasi dan putus daya saat transaksi; 3 tablet offline lalu sambung; simpan 3.000 penjualan; persist ditolak\n- **AC:** nol transaksi terkonfirmasi hilang, nol ganda, nol stok tidak konsisten"
  },
  {
    "id": "T-73",
    "title": "[DOC] Perbarui RTM SRS bagian 6 (T-73)",
    "milestone": "M7",
    "labels": [
      "type:docs",
      "mod:REL",
      "P1"
    ],
    "body": "`type:docs` `mod:REL` `P1` · **S** · Depends: T-70, T-71 · REQ: seluruh Wajib\n\n- [ ] Isi kolom Desain/Kode dan Status dari kolom `REQ` di project (view _Traceability_)\n- **AC:** setiap kebutuhan Wajib punya kasus uji dengan status Lolos"
  },
  {
    "id": "T-74",
    "title": "[REL] UAT dengan Pemilik dan 3 kasir (T-74)",
    "milestone": "M7",
    "labels": [
      "type:test",
      "mod:REL",
      "P0"
    ],
    "body": "`type:test` `mod:REL` `P0` · **M** · Depends: T-72, T-50, T-67 · REQ: USA-02, Kriteria 9\n\n- [ ] Pelatihan kasir baru ≤ 30 menit dan ukur; uji cetak pada printer toko; catat temuan sebagai issue `type:bug`\n- **AC:** Pemilik menyetujui hasil UAT secara tertulis"
  },
  {
    "id": "T-75",
    "title": "[REL] Konfirmasi nilai (usulan) dan pengesahan SRS (T-75)",
    "milestone": "M7",
    "labels": [
      "type:docs",
      "mod:REL",
      "P0",
      "needs-owner-confirmation",
      "srs-change"
    ],
    "body": "`type:docs` `mod:REL` `P0` `needs-owner-confirmation` `srs-change` · **S** · Depends: T-08, T-07 · REQ: SRS bagian 8\n\n- [ ] Konfirmasi seluruh nilai (usulan) ke pemilik; perbaiki rujukan OFF-001 → REL-04; selaraskan jumlah izin 59 vs 57\n- **AC:** checklist validasi SRS bagian 8 tidak lagi berstatus \"Belum\" untuk poin konfirmasi"
  },
  {
    "id": "T-76",
    "title": "[REL] Checklist go-live (T-76)",
    "milestone": "M7",
    "labels": [
      "type:chore",
      "mod:REL",
      "P0"
    ],
    "body": "`type:chore` `mod:REL` `P0` · **M** · Depends: T-74, T-75, T-67, T-64 · REQ: Kriteria 1–9\n\n- [ ] Impor produk awal, akun pengguna, perangkat kasir terdaftar, DNS dan TLS produksi, cadangan pertama terverifikasi, pemantauan aktif\n- [ ] Rencana rollback dan jam peluncuran (hindari jam ramai)\n- **AC:** seluruh kriteria penerimaan SRS bagian 7 terpenuhi"
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.REPO || process.env.GITHUB_REPOSITORY || "SyariefHayat/district-13";

  if (!token) {
    console.error("Error: GITHUB_TOKEN or GH_TOKEN environment variable is required.");
    process.exit(1);
  }

  console.log("Repository:", repo);
  console.log("Starting seed process for " + milestones.length + " milestones, " + labels.length + " labels, and " + issues.length + " issues.");

  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "District13-Issue-Seeder",
    "Content-Type": "application/json"
  };

  // 1. Create or ensure labels
  console.log("\n--- [1/3] Creating labels ---");
  for (const label of labels) {
    try {
      const res = await fetch("https://api.github.com/repos/" + repo + "/labels", {
        method: "POST",
        headers,
        body: JSON.stringify(label)
      });
      if (res.status === 201) {
        console.log("✔ Created label: " + label.name);
      } else if (res.status === 422) {
        console.log("• Label already exists: " + label.name);
      } else {
        const text = await res.text();
        console.warn("! Label " + label.name + " returned status " + res.status + ": " + text);
      }
    } catch (err) {
      console.error("Failed to create label " + label.name + ":", err.message);
    }
  }

  // 2. Create milestones and map their numbers
  console.log("\n--- [2/3] Creating milestones ---");
  const milestoneMap = new Map();
  try {
    const listRes = await fetch("https://api.github.com/repos/" + repo + "/milestones?state=all&per_page=100", { headers });
    if (listRes.ok) {
      const existing = await listRes.json();
      for (const m of existing) {
        const prefix = m.title.match(/^(M[0-7])\\b/)?.[1];
        if (prefix) {
          milestoneMap.set(prefix, m.number);
          console.log("• Found existing milestone: " + m.title + " (#" + m.number + ")");
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch existing milestones:", err.message);
  }

  for (const m of milestones) {
    if (!milestoneMap.has(m.id)) {
      try {
        const res = await fetch("https://api.github.com/repos/" + repo + "/milestones", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: m.title,
            description: m.description,
            state: "open"
          })
        });
        if (res.status === 201) {
          const created = await res.json();
          milestoneMap.set(m.id, created.number);
          console.log("✔ Created milestone: " + m.title + " (#" + created.number + ")");
        } else {
          const text = await res.text();
          console.warn("! Milestone " + m.title + " returned " + res.status + ": " + text);
        }
      } catch (err) {
        console.error("Failed to create milestone " + m.title + ":", err.message);
      }
      await sleep(500);
    }
  }

  // 3. Create all issues sequentially with gentle delay
  console.log("\n--- [3/3] Creating issues ---");
  let createdCount = 0;
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const milestoneNumber = issue.milestone ? milestoneMap.get(issue.milestone) : undefined;

    const payload = {
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    };
    if (milestoneNumber) {
      payload.milestone = milestoneNumber;
    }

    try {
      const res = await fetch("https://api.github.com/repos/" + repo + "/issues", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (res.status === 201) {
        const created = await res.json();
        createdCount++;
        console.log("✔ [" + createdCount + "/" + issues.length + "] Created issue #" + created.number + ": " + issue.title);
      } else {
        const text = await res.text();
        console.error("✖ Failed to create issue " + issue.id + " (HTTP " + res.status + "): " + text);
        if (res.status === 403 && text.includes("secondary rate limit")) {
          console.log("Rate limit encountered, backing off for 30s...");
          await sleep(30000);
          i--;
          continue;
        }
      }
    } catch (err) {
      console.error("Error creating issue " + issue.id + ":", err.message);
    }

    await sleep(1200);
  }

  console.log("\n🎉 Completed! Successfully created " + createdCount + "/" + issues.length + " issues across " + milestoneMap.size + " milestones.");
}

if (process.argv.includes("--dry-run")) {
  console.log("[DRY-RUN] Milestones (" + milestones.length + "):", milestones.map(m => m.id).join(", "));
  console.log("[DRY-RUN] Labels (" + labels.length + ")");
  console.log("[DRY-RUN] Issues (" + issues.length + "):");
  for (const is of issues.slice(0, 5)) {
    console.log("  - " + is.id + ": " + is.title + " [" + is.milestone + "] (" + is.labels.join(", ") + ")");
  }
} else {
  run().catch(err => {
    console.error("Fatal error in seeder:", err);
    process.exit(1);
  });
}
