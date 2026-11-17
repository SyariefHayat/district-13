# Modul Backend API & Database — District 13

RESTful API backend untuk sistem POS dan manajemen toko District 13 dibangun menggunakan **NestJS 12**, **PostgreSQL 16**, dan **Drizzle ORM**.

---

## 🏛️ Arsitektur & Konvensi API (SDD 6.7)

### 1. Prefiks Global & Kompatibilitas Rute (`/api/v1`)

- Seluruh rute API inti menggunakan prefix global `/api/v1` (contoh: `/api/v1/auth/login`, `/api/v1/products`).
- **Backward Compatibility**: Backend dilengkapi URL-rewrite middleware transparan. Request yang datang ke rute langsung (misal `/auth/login` atau `/products`) otomatis diteruskan ke `/api/v1/*`, sehingga kompatibel penuh dengan klien frontend dan koleksi Postman yang ada.
- Rute sistem dikecualikan dari prefix: `GET /` dan `GET /health*`.

### 2. Format Respon Galat Baku (SDD 6.7)

Seluruh HTTP exceptions dan unhandled exceptions difilter melalui `HttpExceptionFilter` dan menghasilkan struktur JSON seragam berbahasa Indonesia:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data gagal",
    "details": ["username tidak boleh kosong", "password minimal 6 karakter"],
    "request_id": "8f9a2b53-4328-4e86-a365-c7d6dfef5581"
  }
}
```

#### Katalog Kode Galat Baku:

| Status | Kode Galat (`code`)     | Pesan Baku                                                 |
| :----- | :---------------------- | :--------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Permintaan tidak valid atau data yang dikirimkan salah     |
| `401`  | `UNAUTHORIZED`          | Autentikasi gagal atau sesi telah berakhir                 |
| `403`  | `FORBIDDEN`             | Akses ditolak: Anda tidak memiliki izin untuk tindakan ini |
| `404`  | `NOT_FOUND`             | Sumber daya yang diminta tidak ditemukan                   |
| `409`  | `CONFLICT`              | Terjadi konflik pada data yang dikirimkan                  |
| `422`  | `UNPROCESSABLE_ENTITY`  | Permintaan tidak dapat diproses                            |
| `429`  | `TOO_MANY_REQUESTS`     | Terlalu banyak permintaan, silakan coba beberapa saat lagi |
| `500`  | `INTERNAL_SERVER_ERROR` | Terjadi kesalahan internal pada server                     |

### 3. Pelacakan Header `X-Request-Id`

- Setiap request ditautkan dengan UUID `X-Request-Id` melalui `RequestIdMiddleware`.
- Klien dapat menyertakan header `X-Request-Id` sendiri untuk distributed tracing. Jika tidak ada, backend akan men-generate UUID baru dan mengembalikannya di respon header `X-Request-Id`.
- `request_id` selalu disertakan pada payload galat dan log Pino untuk memudahkan investigasi insiden.

### 4. Structured JSON Logging (Pino Format)

- Seluruh logging sistem menggunakan format JSON terstruktur via `PinoLoggerService`.
- Bidang standar: `time`, `level`, `module`, `message`, dan `req_id`.
- **Penyensoran Kredensial Otomatis**: Bidang sensitif seperti `password`, `token`, `accessToken`, `refreshToken`, `authorization`, dan `secret` otomatis disensor menjadi `[REDACTED]`.

### 5. Health Check Endpoints

- `GET /health`: Liveness probe untuk orchestrator kontainer / Docker Compose.
  ```json
  { "status": "ok", "timestamp": "2026-11-17T12:00:00.000Z", "uptime": 142 }
  ```
- `GET /health/ready`: Readiness probe yang menguji koneksi langsung ke PostgreSQL (`SELECT 1`).
  - Mengembalikan HTTP `200` jika database terhubung:
    ```json
    { "status": "ok", "database": "connected", "timestamp": "..." }
    ```
  - Mengembalikan HTTP `503 Service Unavailable` jika database terputus.

---

## 🗄️ Manajemen Database & Migrasi (Drizzle ORM)

Skema database didefinisikan menggunakan Drizzle ORM di `src/drizzle/schema/` dan migrasi SQL berversi tersimpan di `drizzle/`.

### Perintah Database:

```bash
# Menghasilkan file migrasi SQL baru dari schema TypeScript
npm run db:generate

# Menjalankan migrasi berulang (idempotent migration runner)
npm run db:migrate:run

# Mengisi database dengan data awal sintetis
npm run db:seed

# Membuka antarmuka Drizzle Studio di browser
npm run db:studio
```

---

## 🔑 Autentikasi & Otorisasi (RBAC)

- `POST /auth/login`: Menerima `{ username, password }`, mengembalikan access token (15 menit) dan menetapkan refresh token di `HttpOnly` cookie.
- `POST /auth/refresh`: Memerlukan cookie refresh dan header `X-CSRF-Token`, merotasi token refresh.
- `POST /auth/logout`: Mencabut sesi refresh token aktif.
- Password di-hash menggunakan algoritma modern **Argon2id**.
- Role-Based Access Control (**RBAC**) mendukung peran: `OWNER`, `ADMIN`, `CASHIER` dengan permission catalog terpusat di `src/auth/permissions/permissions.ts`.

---

## 🧪 Pengujian & Kualitas Kode

```bash
# Oxlint type-aware linting
npm run lint

# TypeScript strict type checking
npm run typecheck

# Menjalankan unit test Vitest
npm test

# Menjalankan pengujian Postman lokal
# Gunakan collection di ../postman/collections dengan env ../postman/environments/local.example.environment.yaml
```
