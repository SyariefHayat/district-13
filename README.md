# District 13 — Point of Sale (POS) & Manajemen Toko

Sistem Point of Sale (POS) dan manajemen operasional toko District 13 berbasis monorepo modern, dirancang dengan arsitektur **Local-First PWA** dan backend **NestJS + Drizzle ORM** yang tangguh, cepat, serta hemat biaya operasional.

---

## 🏗️ Arsitektur Monorepo

```
district-13/
├── frontend/             # Aplikasi PWA Kasir, Admin, & Pemilik (React 19, Vite, Tailwind v4, shadcn/ui)
├── backend/              # RESTful API Engine (NestJS 12, Drizzle ORM, PostgreSQL 16)
├── deploy/               # Konfigurasi reverse proxy Caddy & deployment Railway
├── postman/              # Koleksi pengujian otomatis API & spesifikasi lingkungan
├── scripts/              # Utilitas automasi (seed issues, generator data)
├── docker-compose.yml    # Stack kontainer pengembangan lokal
└── README.md             # Panduan root monorepo
```

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### Prasyarat Sistem

- **Node.js**: `v22.x` atau lebih baru
- **npm**: `v10.x` atau lebih baru
- **Docker & Docker Compose**: untuk menjalankan PostgreSQL dan stack terisolasi

### 1. Menjalankan Seluruh Stack dengan Docker Compose

Jalankan satu perintah untuk menyalakan PostgreSQL, Backend API, dan Frontend PWA:

```bash
docker compose up -d
```

Layanan akan tersedia di:

- **Frontend PWA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000` (Health: `http://localhost:3000/health`)
- **PostgreSQL**: `localhost:5432` (db: `district13`, user: `postgres`, password: `postgres_password`)

### 2. Seeding Data Contoh Sintetis

Setelah database menyala, jalankan seeder data awal:

```bash
npm run db:seed
```

Data sintetis (pengguna owner, admin, kasir, kategori, produk, dan stok) akan otomatis terisi.

---

## 📱 Akses Tablet Kasir via Jaringan Lokal (LAN / Wi-Fi)

Frontend Vite telah dikonfigurasi untuk mendengarkan pada seluruh antarmuka jaringan (`0.0.0.0:5173`).

1. Pastikan komputer host dan Tablet kasir (Android / iPad) terhubung ke jaringan Wi-Fi yang sama.
2. Cari alamat IP lokal komputer host:
   - **Linux / macOS**: `ip route get 1 | awk '{print $7}'` atau `ifconfig`
   - **Windows**: `ipconfig` (lihat IPv4 Address)
3. Di browser tablet (disarankan Google Chrome untuk dukungan Web Bluetooth printer):
   ```
   http://<IP_KOMPUTER_HOST>:5173
   ```
4. Tambahkan ke Layar Utama (_Install PWA_) melalui menu browser untuk pengalaman aplikasi kasir layar penuh.

---

## 🛠️ Perintah Kerja Monorepo

| Perintah              | Deskripsi                                                       |
| :-------------------- | :-------------------------------------------------------------- |
| `npm run lint`        | Menjalankan Oxlint di seluruh frontend dan backend (0 galat)    |
| `npm run typecheck`   | Validasi tipe TypeScript strict di semua paket (`tsc --noEmit`) |
| `npm test`            | Menjalankan rangkaian pengujian Vitest                          |
| `npm run build`       | Menghasilkan bundel produksi untuk frontend dan backend         |
| `npm run docker:up`   | Menyalakan stack Docker Compose di background                   |
| `npm run docker:down` | Menghentikan seluruh kontainer Docker Compose                   |
| `npm run db:seed`     | Mengisi database dengan data contoh sintetis                    |

---

## 📚 Dokumentasi Terdistribusi Per Modul

Untuk panduan mendalam setiap modul, silakan baca dokumentasi terkait di lokasinya masing-masing:

- **[Modul Backend & API](backend/README.md)**: Standar API `/api/v1`, format galat SDD 6.7, logging Pino JSON, pelacakan `X-Request-Id`, endpoint health check, dan migrasi Drizzle.
- **[Modul Frontend PWA](frontend/README.md)**: Arsitektur React 19, helper Rupiah/WIB, konfigurasi PWA manifest, dan ergonomi sentuh kasir ≥ 44px.
- **[Modul CI & Workflow](.github/workflows/README.md)**: Quality gates CI, caching dependensi npm, dan aturan pull request.
- **[Modul Infrastruktur & Cloud Deploy](deploy/README.md)**: Stack Docker Compose, panduan LAN tablet, reverse proxy Caddy TLS, dan audit anggaran cloud bulanan (< Rp 250.000).
