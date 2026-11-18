# Matriks Hak Akses RBAC (Role-Based Access Control) - District 13

Dokumen ini mendefinisikan secara lengkap dan terstruktur katalog **57 izin RBAC** untuk sistem Point of Sale (POS) **District 13**, mencakup pemetaan peran **Pemilik (Owner)**, **Admin**, dan **Kasir (Cashier)**.

Spesifikasi ini merupakan konsolidasi resmi dari:

- **SRS v0.1 Bagian 2.2**: Kelas Pengguna dan Hak Akses.
- **System Design Document (SDD) Lampiran C**: Katalog Izin (RBAC).
- **Keputusan Arsitektur B-02 & B-04**: Resolusi perbedaan 59 vs 57 izin (penambahan izin `inventory.adjust` untuk inventaris fisik).

---

## 1. Aturan Bisnis & Batasan Utama

1. **Pemilik (REQ-F-USR-006)**:
   - Memiliki akses penuh ke seluruh pengelolaan data, harga produk, laporan keuangan (termasuk laba bersih), pengaturan toko, dan log audit lengkap.
   - **DILARANG** membuka shift (`shift.open`) dan **DILARANG** membuat penjualan kasir (`sale.create`). Kedua fungsi ini mutlak milik Kasir.
   - Total izin Pemilik: **49 Izin**.

2. **Admin**:
   - Bertanggung jawab atas operasional toko, produk (tanpa izin mengubah harga jual/beli), pemindahan stok gudang ke display, penyesuaian stok, jadwal staf, laporan operasional, dan penutupan darurat shift kasir (`shift.close_any`).
   - Tidak dapat melihat laporan laba bersih, laporan diskon, atau mengubah pengaturan toko.
   - Total izin Admin: **34 Izin**.

3. **Kasir**:
   - Bertanggung jawab atas penjualan di tablet kasir, membuka dan menutup shift sendiri, mencatat kas masuk/keluar laci sendiri, membatalkan (_void_) transaksi sendiri selama shift masih buka, melihat katalog, dan melihat jadwal kerja sendiri.
   - Total izin Kasir: **14 Izin**.

---

## 2. Tabel Matriks Lengkap (57 Izin)

Keterangan:

- **V** = Diizinkan
- **—** = Tidak Diizinkan

|   No   | Modul / Kelompok   | Kode Izin (`permission_code`)   | Deskripsi Izin                  | Pemilik | Admin | Kasir | Keterangan & Rujukan              |
| :----: | :----------------- | :------------------------------ | :------------------------------ | :-----: | :---: | :---: | :-------------------------------- |
| **1**  | Pengguna           | `user.list`                     | Melihat daftar pengguna         |  **V**  | **V** |   —   | USR-001                           |
| **2**  | Pengguna           | `user.create`                   | Membuat pengguna                |  **V**  | **V** |   —   | Admin dibatasi hanya Kasir (B-03) |
| **3**  | Pengguna           | `user.password.change_self`     | Mengganti kata sandi sendiri    |  **V**  | **V** |   —   | USR-005                           |
| **4**  | Pengguna           | `user.admin.update`             | Mengubah profil admin           |  **V**  |   —   |   —   | Hak eksklusif Pemilik             |
| **5**  | Pengguna           | `user.cashier.update`           | Mengubah profil kasir           |  **V**  | **V** |   —   | USR-002                           |
| **6**  | Pengguna           | `user.cashier.reset_credential` | Mengatur ulang kredensial kasir |  **V**  | **V** |   —   | USR-002                           |
| **7**  | Pengguna           | `user.delete`                   | Menghapus pengguna              |  **V**  |   —   |   —   | Hanya jika belum ada transaksi    |
| **8**  | Produk             | `product.view`                  | Melihat produk                  |  **V**  | **V** | **V** | PRD-001                           |
| **9**  | Produk             | `product.create`                | Menambah produk baru            |  **V**  | **V** |   —   | PRD-001                           |
| **10** | Produk             | `product.update`                | Mengubah detail produk          |  **V**  | **V** |   —   | Deskripsi, kategori, unit         |
| **11** | Produk             | `product.price.update`          | Mengubah harga produk           |  **V**  |   —   |   —   | Harga hanya diubah Pemilik        |
| **12** | Produk             | `product.deactivate`            | Menonaktifkan produk            |  **V**  | **V** |   —   | PRD-004 (soft deactivate)         |
| **13** | Produk             | `product.availability.update`   | Mengubah ketersediaan produk    |  **V**  | **V** |   —   | PRD-005 (tersedia / habis)        |
| **14** | Produk             | `brand.manage`                  | Mengelola brand produk          |  **V**  | **V** |   —   | Tambah/ubah brand                 |
| **15** | Produk             | `category.view`                 | Melihat kategori                |  **V**  | **V** | **V** | Tampil di kasir & admin           |
| **16** | Produk             | `category.manage`               | Mengelola kategori              |  **V**  | **V** |   —   | Tambah/ubah kategori              |
| **17** | Produk             | `addon.view`                    | Melihat add-on                  |  **V**  | **V** | **V** | Ekstra shot, sirup, dll           |
| **18** | Produk             | `addon.manage`                  | Mengelola add-on                |  **V**  | **V** |   —   | Tambah/ubah add-on                |
| **19** | Produk             | `addon.price.update`            | Mengubah harga add-on           |  **V**  |   —   |   —   | Harga add-on eksklusif Pemilik    |
| **20** | Diskon             | `discount.view`                 | Melihat daftar diskon           |  **V**  | **V** | **V** | Diskon tampil di kasir            |
| **21** | Diskon             | `discount.manage`               | Mengelola diskon                |  **V**  | **V** |   —   | Diskon nominal atau persen        |
| **22** | Inventaris         | `inventory.dashboard.view`      | Melihat dasbor inventaris       |  **V**  | **V** |   —   | Saldo gudang & display            |
| **23** | Inventaris         | `inventory.movement.view`       | Melihat pergerakan stok         |  **V**  | **V** |   —   | INV-005 (kartu stok)              |
| **24** | Inventaris         | `inventory.transfer`            | Memindahkan stok ke display     |  **V**  | **V** |   —   | Gudang → Display                  |
| **25** | Inventaris         | `inventory.restock`             | Mencatat stok masuk (restock)   |  **V**  |   —   |   —   | Pembelian barang / modal          |
| **26** | Inventaris         | `inventory.adjust`              | Menyesuaikan stok (audit stok)  |  **V**  | **V** |   —   | Ditambahkan via Keputusan B-04    |
| **27** | Jadwal             | `schedule.manage`               | Mengelola jadwal staf           |  **V**  | **V** |   —   | SCH-001                           |
| **28** | Jadwal             | `schedule.view_all`             | Melihat semua jadwal staf       |  **V**  | **V** |   —   | Kalender toko                     |
| **29** | Jadwal             | `schedule.view_own`             | Melihat jadwal sendiri          |    —    |   —   | **V** | Jadwal shift kasir                |
| **30** | Shift              | `shift.open`                    | Membuka shift                   |    —    |   —   | **V** | Hanya kasir pada tablet (SHF-001) |
| **31** | Shift              | `shift.view_own`                | Melihat shift sendiri           |    —    |   —   | **V** | Rekap kas shift aktif             |
| **32** | Shift              | `shift.view_all`                | Melihat semua shift             |  **V**  | **V** |   —   | Riwayat shift seluruh kasir       |
| **33** | Shift              | `shift.close_own`               | Menutup shift sendiri           |    —    |   —   | **V** | Hitung fisik kas laci             |
| **34** | Shift              | `shift.close_any`               | Menutup shift siapa pun         |  **V**  | **V** |   —   | Penutupan darurat / admin         |
| **35** | Kas Masuk/Keluar   | `cash.record_own`               | Mencatat kas shift sendiri      |    —    |   —   | **V** | Kas kecil / beli es batu          |
| **36** | Kas Masuk/Keluar   | `cash.record_any`               | Mencatat kas untuk siapa pun    |  **V**  |   —   |   —   | Kas luar shift oleh Pemilik       |
| **37** | Kas Masuk/Keluar   | `cash.update`                   | Mengubah catatan kas            |  **V**  |   —   |   —   | Koreksi kesalahan kas             |
| **38** | Kas Masuk/Keluar   | `cash.delete`                   | Menghapus catatan kas           |  **V**  |   —   |   —   | Pembatalan kas luar shift         |
| **39** | Penjualan          | `sale.create`                   | Membuat penjualan               |    —    |   —   | **V** | Transaksi kasir (SAL-001)         |
| **40** | Penjualan          | `sale.view_all`                 | Melihat semua transaksi         |  **V**  |   —   |   —   | Audit lengkap transaksi           |
| **41** | Penjualan          | `sale.view_own`                 | Melihat transaksi sendiri       |    —    |   —   | **V** | Struk shift aktif kasir           |
| **42** | Penjualan          | `sale.void`                     | Membatalkan transaksi (void)    |    —    |   —   | **V** | Kasir asli & shift buka (SAL-014) |
| **43** | Laporan            | `report.dashboard`              | Ringkasan dasbor                |  **V**  | **V** | **V** | Metrik ringkas hari ini           |
| **44** | Laporan            | `report.sales`                  | Laporan penjualan               |  **V**  | **V** |   —   | Rekap omzet & volume              |
| **45** | Laporan            | `report.discount`               | Laporan diskon                  |  **V**  |   —   |   —   | Efektivitas promosi               |
| **46** | Laporan            | `report.payment`                | Laporan metode pembayaran       |  **V**  |   —   |   —   | Tunai vs QRIS vs Transfer         |
| **47** | Laporan            | `report.profit`                 | Laporan laba kotor & bersih     |  **V**  |   —   |   —   | Berbasis HPP (cost price)         |
| **48** | Laporan            | `report.inventory`              | Laporan inventaris              |  **V**  | **V** |   —   | Valuasi stok & perputaran         |
| **49** | Laporan            | `report.cash`                   | Laporan kas                     |  **V**  | **V** |   —   | Rekap saldo laci                  |
| **50** | Laporan            | `report.shift`                  | Laporan shift                   |  **V**  | **V** |   —   | Selisih kas per shift             |
| **51** | Laporan            | `report.cash_entry`             | Laporan kas masuk/keluar        |  **V**  | **V** |   —   | Mutasi kas operasional            |
| **52** | Laporan            | `report.cashier_performance`    | Laporan kinerja kasir           |  **V**  | **V** |   —   | Transaksi & void per kasir        |
| **53** | Audit & Pengaturan | `audit.read_full`               | Membaca log audit lengkap       |  **V**  |   —   |   —   | Nilai sebelum & sesudah           |
| **54** | Audit & Pengaturan | `audit.read_operational`        | Membaca log audit operasional   |  **V**  | **V** |   —   | Aktivitas umum                    |
| **55** | Audit & Pengaturan | `settings.view`                 | Melihat pengaturan toko         |  **V**  | **V** | **V** | Info toko di struk                |
| **56** | Audit & Pengaturan | `settings.update`               | Mengubah pengaturan toko        |  **V**  |   —   |   —   | Tarif pajak, alamat, footer       |
| **57** | Audit & Pengaturan | `queue.reset`                   | Mengatur ulang nomor antrean    |  **V**  |   —   |   —   | Reset manual queue epoch          |

---

## 3. Struktur Format Data JSON (untuk Otomasi)

Data referensi di atas dikonversi ke format JSON terstruktur untuk konsumsi oleh seed runner maupun pengujian integrasi:

```json
[
  {
    "code": "user.list",
    "category": "Pengguna",
    "description": "Melihat daftar pengguna",
    "owner": true,
    "admin": true,
    "cashier": false
  },
  {
    "code": "user.create",
    "category": "Pengguna",
    "description": "Membuat pengguna",
    "owner": true,
    "admin": true,
    "cashier": false
  },
  {
    "code": "product.view",
    "category": "Produk",
    "description": "Melihat produk",
    "owner": true,
    "admin": true,
    "cashier": true
  },
  {
    "code": "product.price.update",
    "category": "Produk",
    "description": "Mengubah harga produk",
    "owner": true,
    "admin": false,
    "cashier": false
  },
  {
    "code": "inventory.adjust",
    "category": "Inventaris",
    "description": "Menyesuaikan stok (penyesuaian inventaris)",
    "owner": true,
    "admin": true,
    "cashier": false
  },
  {
    "code": "shift.open",
    "category": "Shift",
    "description": "Membuka shift",
    "owner": false,
    "admin": false,
    "cashier": true
  },
  {
    "code": "sale.create",
    "category": "Penjualan",
    "description": "Membuat penjualan",
    "owner": false,
    "admin": false,
    "cashier": true
  },
  {
    "code": "audit.read_full",
    "category": "Audit & Pengaturan",
    "description": "Membaca log audit lengkap",
    "owner": true,
    "admin": false,
    "cashier": false
  }
]
```
