# Checklist Peluncuran Produksi (Go-Live) — District 13 (T-76)

Dokumen ini adalah ringkasan panduan peluncuran produksi sistem POS District 13.
Panduan teknis lengkap dan prosedur operasional terperinci dapat dilihat di:
[deploy/CHECKLIST-GOLIVE.md](file:///home/syarief/projects/district-13/deploy/CHECKLIST-GOLIVE.md)

---

## Ringkasan Kriteria Penerimaan SRS Bagian 7 (Go-Live Ready)

1. **Kasus Uji Wajib**: 100% Lolos di CI (Vitest, Postgres Integration, Playwright E2E).
2. **Uji Beban**: Lolos simulasi 3 kasir dan 2 juta data transaksi (P95 < 1s).
3. **Uji Offline & Sinkronisasi**: 3 tablet offline berhasil sinkronisasi kembali tanpa selisih atau duplikasi transaksi.
4. **Uji Kegagalan (Fault Injection)**: Nol transaksi terkonfirmasi hilang, nol duplikat, integritas stok 100%.
5. **Pemulihan Bencana**: Prosedur cadangan dan pemulihan terverifikasi (RPO $\le 1$ jam, RTO $\le 1$ hari).
6. **Matriks Izin (RBAC)**: 57 izin ditegakkan secara ketat di server backend.
7. **Pencetakan Struk Toko**: Kompatibilitas printer Bluetooth EPPOS EP-RPP02 58mm terverifikasi sukses.
8. **Penutupan Shift**: Penarikan kas akhir tercatat rapi, saldo laci Rp0, dan rekonsiliasi selisih kas akurat.
9. **Persetujuan Tertulis UAT**: Telah ditandatangani oleh Pemilik dan kasir ([runbooks/uat-signoff.md](file:///home/syarief/projects/district-13/runbooks/uat-signoff.md)).
