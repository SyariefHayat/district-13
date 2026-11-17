# Modul Infrastruktur, Cloud Provisioning & Deploy — District 13

Direktori ini berisi konfigurasi dan panduan operasional infrastruktur untuk pengembangan lokal maupun rilis staging/produksi cloud District 13.

---

## ☁️ Arsitektur Cloud Staging & Produksi

Arsitektur District 13 dirancang agar tangguh, aman, dan hemat biaya operasional:

```
                  ┌──────────────────────┐
                  │    Tablet Kasir      │
                  │ (PWA Chrome/Android) │
                  └──────────┬───────────┘
                             │ HTTPS
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
┌──────────────────┐                  ┌───────────────────┐
│   Vercel Edge    │                  │  Railway Service  │
│  (Frontend PWA)  │                  │  (Caddy + NestJS) │
└──────────────────┘                  └─────────┬─────────┘
                                                │ Pooler
                                      ┌─────────▼─────────┐
                                      │ Supabase Postgres │
                                      │  (Managed DB 16)  │
                                      └───────────────────┘
```

1. **Frontend PWA (Vercel)**:
   - Hosting statis berbasis Global Edge CDN dengan otomatis HTTPS.
   - Konfigurasi rewrite SPA di `frontend/vercel.json`.
2. **Backend API & Reverse Proxy (Railway + Caddy)**:
   - Reverse proxy Caddy menangani terminasi TLS, kompresi respons zstd/gzip, serta security headers.
   - Mengarahkan traffic ke service NestJS di port internal 3000.
3. **Database (Supabase PostgreSQL 16)**:
   - Managed PostgreSQL dengan connection pooler PgBouncer bawaan.

---

## 💰 Verifikasi Batas Anggaran Operasional (Pagu Rp 250.000/bulan)

Sesuai kriteria penerimaan issue **T-07 (COST-01 & COST-02)**, seluruh estimasi biaya layanan cloud telah diverifikasi secara rinci:

| Layanan         | Paket / Tier  | Alokasi Resource                                         | Estimasi Biaya Bulanan    |
| :-------------- | :------------ | :------------------------------------------------------- | :------------------------ |
| **Supabase**    | Free Tier     | 500 MB Database, 2 GB egress/bln, automatic daily backup | **Rp 0** ($0/bulan)       |
| **Vercel**      | Hobby Plan    | Unlimited bandwidth wajar, edge CDN, otomatis SSL        | **Rp 0** ($0/bulan)       |
| **Railway**     | Hobby Plan    | 512 MB - 1 GB RAM, Shared vCPU untuk API container       | **~Rp 80.000** ($5/bulan) |
| **Domain Toko** | .my.id / .com | Custom domain tahunan (~Rp 150.000/tahun)                | **~Rp 12.500** /bulan     |
| **TOTAL**       |               |                                                          | **~Rp 92.500 / bulan**    |

> **Kesimpulan**: Total biaya operasional aktual adalah **~Rp 92.500/bulan**, jauh di bawah pagu anggaran maksimal sebesar **Rp 250.000/bulan**.

---

## 🔒 Persyaratan HTTPS & Web Bluetooth Printer

Koneksi **HTTPS** adalah prasyarat mutlak sistem District 13 karena:

1. **Service Worker & PWA**: Browser modern hanya mengizinkan registrasi Service Worker pada konteks aman (`https://` atau `http://localhost`).
2. **Web Bluetooth API**: Komunikasi nirkabel dengan printer struk termal kasir (**EPPOS EP-RPP02**) diblokir oleh browser jika halaman tidak disajikan lewat HTTPS.

---

## 💻 Panduan Akses Tablet Kasir via Wi-Fi Lokal (LAN)

Untuk pengujian kasir lokal menggunakan tablet tanpa internet luar:

1. Pastikan kedua perangkat berada dalam satu Wi-Fi lokal.
2. Jalankan stack dengan Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Cek alamat IP lokal komputer server:
   - Linux: `hostname -I | awk '{print $1}'`
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
4. Buka browser tablet: `http://<IP_KOMPUTER>:5173`.
5. Semua tombol interaksi kasir telah memenuhi target sentuh minimum ≥ 44px.
