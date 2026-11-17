# Modul Frontend PWA — District 13

Aplikasi antarmuka Progressive Web App (PWA) untuk Kasir, Admin Toko, dan Pemilik District 13 dibangun menggunakan **React 19**, **Vite**, **Tailwind CSS v4**, dan **shadcn/ui**.

---

## 📱 Fitur & Arsitektur PWA

- **Arsitektur Local-First**: Responsif, cepat, dan siap beroperasi dengan dukungan Web Storage & outbox sinkronisasi offline.
- **Standar PWA (Progressive Web App)**:
  - Konfigurasi Web App Manifest di `public/manifest.json`.
  - Mode tampilan `standalone` (pengalaman aplikasi native layar penuh).
  - Tema warna `#0f172a` dengan dukungan dark/light theme otomatis.
- **Target Sentuh Kasir Ergonomis**: Seluruh tombol interaksi kasir (pemilihan produk, stepper jumlah, tombol hapus, checkout) dirancang dengan ukuran target sentuh minimal **≥ 44px** (`min-h-[44px] min-w-[44px]`) untuk menghindari _misclick_ saat digunakan di tablet kasir.
- **Bahasa Antarmuka**: 100% menggunakan Bahasa Indonesia.

---

## 🛠️ Helper Pemformatan Baku (`src/lib/formatters.ts`)

Untuk menjaga konsistensi di seluruh tampilan toko, gunakan helper terpusat:

```typescript
import { formatRupiah, formatWibDate } from "@/lib/formatters";

// Format mata uang Rupiah bulat tanpa desimal:
formatRupiah(15000); // "Rp 15.000"
formatRupiah(0); // "Rp 0"

// Format tanggal dan waktu Waktu Indonesia Barat (WIB):
formatWibDate(new Date()); // "17 Nov 2026, 19.00"
```

---

## 👥 Mode Tampilan & Hak Akses (Role Guards)

Aplikasi memiliki 3 mode tampilan utama yang terlindungi melalui autentikasi:

1. **Mode Kasir (`/dashboard/cashier`, `/pos`)**: Antarmuka Point of Sale dioptimalkan untuk sentuhan cepat pada tablet, pembukaan shift, pencatatan transaksi kasir, dan integrasi cetak struk.
2. **Mode Admin (`/dashboard/admin`, `/products`, `/stocks`)**: Pengawasan stok gudang, transfer display, manajemen produk & add-on, serta jadwal staf.
3. **Mode Pemilik (`/dashboard`, `/reports`, `/profit`, `/audits`)**: Analitik laba/rugi, laporan shift & audit penjualan, serta pengaturan pengguna & toko.

---

## 📲 Pengujian Tablet di Jaringan Lokal (LAN / Wi-Fi)

Untuk menguji langsung antarmuka kasir pada Tablet:

1. Jalankan dev server Vite:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
2. Pastikan Tablet dan PC pengembang terhubung ke Wi-Fi yang sama.
3. Buka browser tablet pada:
   ```
   http://<IP_KOMPUTER_HOST>:5173
   ```
4. Verifikasi bahwa target tombol sentuh nyaman digunakan (≥ 44px) dan responsif.

---

## 🧪 Skrip & Kualitas Kode

```bash
# Menjalankan Vite development server
npm run dev

# Menjalankan Oxlint linter
npm run lint

# TypeScript strict type checking
npm run typecheck

# Membangun bundel produksi
npm run build
```
