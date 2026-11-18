# Dokumentasi Modul Audit Log (District 13)

Direktori ini memuat spesifikasi teknis, arsitektur pencatatan transaksi yang tidak dapat diubah (_append-only immutable audit trail_), aturan pemisahan tingkat akses (Pemilik vs Admin), sanitasi data rahasia, serta panduan pengujian untuk Milestone M1 (`[SET]`, Tugas T-19).

## Berkas Dokumentasi

- [audit-logs-and-monitoring.md](file:///home/syarief/projects/district-13/docs/audit-logs/audit-logs-and-monitoring.md): Arsitektur lengkap layanan `AuditService`, integrasi transaksi atomik basis data (AC: kegagalan audit membatalkan perubahan), pemfilteran otomatis berbasis peran (Pemilik: lengkap, Admin: operasional, Kasir: dilarang), penegakan skema append-only melalui database trigger, katalog entitas & aksi, spesifikasi endpoint `GET /audit-logs`, dan laporan verifikasi pengujian.
