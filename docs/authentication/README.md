# Dokumentasi Modul Autentikasi & RBAC (District 13)

Direktori ini memuat spesifikasi teknis, arsitektur keamanan, alur sesi JWT & rotasi refresh token, kebijakan penguncian akun (_account lockout_), guard kontrol akses berbasis peran (RBAC 57 izin di sisi server), aturan kepemilikan data, serta panduan pengujian untuk Milestone M1 (`[USR]`, Tugas T-17 dan T-18).

## Berkas Dokumentasi

- [authentication-and-rbac.md](file:///home/syarief/projects/district-13/docs/authentication/authentication-and-rbac.md): Spesifikasi lengkap autentikasi pengguna, siklus hidup token JWT/Cookie, rotasi token refresh dengan deteksi replay, penguncian akun (5 menit setelah 5 kali gagal), endpoint introspeksi identitas `GET /auth/me`, guard `@RequirePermission`, penegakan REQ-F-USR-006 (larangan shift/transaksi bagi Pemilik & Admin), aturan verifikasi data kepemilikan (`OwnershipService`), kode kesalahan standar, dan integrasi pengujian.
