# Runbook Operasional & Penanganan Insiden — District 13 (T-68)

Dokumen ini adalah salinan panduan operasional standar (_Operational Runbook_) sistem POS District 13.
Panduan lengkap dan konfigurasi infrastruktur dapat diakses di:
[deploy/RUNBOOK.md](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md)

---

## 📌 Ringkasan Skenario Insiden & Penanggung Jawab (AC T-68)

Setiap insiden operasional di bawah ini memiliki langkah mitigasi terperinci, penanggung jawab (PIC), dan prosedur verifikasi:

| No    | Jenis Insiden                             | Gejala Utama                                                             | Penanggung Jawab (PIC)                | Target Pemulihan / SLA                  | Dokumen Rujukan                                                                            |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| **1** | **Server Mati (Server Down)**             | Endpoint `/health/ready` non-200 > 2 kali; UptimeRobot alert ke Discord. | Kasir (offline POS) & DevOps/Engineer | $\le 5$ menit restart; kasir 0 downtime | [deploy/RUNBOOK.md#insiden-1](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |
| **2** | **Basis Data Penuh (DB Full)**            | Alert kuota disk > 80%, log `disk full`, transaksi gagal 500/503.        | DevOps / DBA & Pemilik                | $\le 15$ menit                          | [deploy/RUNBOOK.md#insiden-2](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |
| **3** | **Printer Putus (Printer Offline)**       | Dialog PWA error cetak struk; Bluetooth EPPOS terputus.                  | Kasir & Store Manager                 | $\le 2$ menit (opsi e-Receipt WA)       | [deploy/RUNBOOK.md#insiden-3](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |
| **4** | **Sinkronisasi Macet (Sync Stuck)**       | Antrean offline di tablet > 0; peringatan tertunda > 4 jam.              | Kasir (lapor) & Backend Engineer      | Otomatis backoff / $\le 10$ menit       | [deploy/RUNBOOK.md#insiden-4](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |
| **5** | **Stok Negatif (Negative Stock)**         | Laporan inventaris minus; rekonsiliasi malam mendeteksi selisih.         | Store Manager (opname) & Pemilik      | $\le 1$ jam opname fisik                | [deploy/RUNBOOK.md#insiden-5](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |
| **6** | **Pemulihan Bencana (Disaster Recovery)** | Infrastruktur server hancur/korup; perlu pemulihan total dari S3.        | DevOps Lead & Pemilik                 | RPO $\le 1$ jam, RTO $\le 1$ hari       | [deploy/RUNBOOK.md#insiden-6](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md) |

Rincian panduan langkah demi langkah, perintah shell, kueri SQL, dan metode verifikasi tercantum lengkap di [deploy/RUNBOOK.md](file:///home/syarief/projects/district-13/deploy/RUNBOOK.md).
