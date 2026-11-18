# Backend API & Database Module — District 13

The RESTful API engine for District 13 POS & Store Management, built with **NestJS 12**, **PostgreSQL 16**, and **Drizzle ORM**.

---

## 🏛️ API Architecture & Standards (SDD 6.7)

### 1. Global Prefix & Backward-Compatible Routing (`/api/v1`)

- All core business routes are mounted under the global prefix `/api/v1` (e.g., `/api/v1/auth/login`, `/api/v1/products`).
- **Seamless Compatibility**: A transparent URL rewrite middleware allows legacy clients and existing Postman collections to call unprefixed routes (e.g., `/auth/login`, `/products`) without breaking changes.
- Root and health check routes (`GET /`, `GET /health`, `GET /health/ready`) are served directly.

### 2. Standardized Error Response (SDD 6.7)

All HTTP exceptions and unexpected errors are intercepted by `HttpExceptionFilter` and formatted into a uniform JSON response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data validation failed",
    "details": [
      "username must not be empty",
      "password must be at least 6 characters"
    ],
    "request_id": "8f9a2b53-4328-4e86-a365-c7d6dfef5581"
  }
}
```

#### Standard Error Catalog:

| Status | Error Code (`code`)     | Default Message                                            |
| :----- | :---------------------- | :--------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Permintaan tidak valid atau data yang dikirimkan salah     |
| `401`  | `UNAUTHORIZED`          | Autentikasi gagal atau sesi telah berakhir                 |
| `403`  | `FORBIDDEN`             | Akses ditolak: Anda tidak memiliki izin untuk tindakan ini |
| `404`  | `NOT_FOUND`             | Sumber daya yang diminta tidak ditemukan                   |
| `409`  | `CONFLICT`              | Terjadi konflik pada data yang dikirimkan                  |
| `422`  | `UNPROCESSABLE_ENTITY`  | Permintaan tidak dapat diproses                            |
| `429`  | `TOO_MANY_REQUESTS`     | Terlalu banyak permintaan, silakan coba beberapa saat lagi |
| `500`  | `INTERNAL_SERVER_ERROR` | Terjadi kesalahan internal pada server                     |

### 3. Distributed Tracing with `X-Request-Id`

- Every incoming request is assigned a UUID `X-Request-Id` via `RequestIdMiddleware`.
- Clients can provide an `X-Request-Id` header for cross-service tracing. If omitted, the server automatically generates one.
- The `request_id` is always propagated into the response headers, error payloads, and Pino logs for fast diagnostics.

### 4. Structured JSON Logging (Pino Format)

- Powered by `PinoLoggerService`, emitting single-line JSON logs with: `time`, `level`, `module`, `message`, and `req_id`.
- **Automatic Sensitive Field Redaction**: Keys matching `password`, `token`, `accessToken`, `refreshToken`, `secret`, `authorization`, and `cookie` are masked to `[REDACTED]`.

### 5. Health Check Endpoints

- `GET /health`: Liveness probe for Docker Compose / container orchestrators.
  ```json
  { "status": "ok", "timestamp": "2026-11-18T12:00:00.000Z", "uptime": 142 }
  ```
- `GET /health/ready`: Readiness probe verifying live database connectivity (`SELECT 1`).
  - Returns HTTP `200` with `{ "status": "ok", "database": "connected" }` when healthy.
  - Returns HTTP `503 Service Unavailable` if database connection drops.

---

## 🗄️ Database Management & Migrations (Drizzle ORM)

Database schemas are defined in `src/drizzle/schema/` using Drizzle ORM, with versioned SQL migrations located in `drizzle/`.

### Database Commands:

```bash
# Generate new SQL migration files from TypeScript schemas
npm run db:generate

# Execute migrations programmatically (idempotent runner)
npm run db:migrate:run

# Populate initial demo data (catalog, categories, users, inventory)
npm run db:seed

# Launch visual Drizzle Studio web interface
npm run db:studio
```

---

## 🔑 Authentication & Role-Based Access Control (RBAC)

- `POST /auth/login`: Accepts `{ username, password }`, returns a 15-minute access token and sets an opaque refresh token in an `HttpOnly` cookie.
- `POST /auth/refresh`: Requires the refresh cookie and a matching `X-CSRF-Token` header, rotating tokens.
- `POST /auth/logout`: Revokes active refresh sessions and clears cookies.
- Passwords are encrypted using **Argon2id**.
- RBAC supports three user tiers: `OWNER`, `ADMIN`, and `CASHIER`, enforced with route guards (`JwtAuthGuard`, `PermissionsGuard`) and a central permission catalog in `src/auth/permissions/permissions.ts`.

---

## 🧪 Testing & Code Quality

```bash
# Oxlint type-aware linting
npm run lint

# TypeScript strict type checking
npm run typecheck

# Execute Vitest test suite
npm test

# Run Postman test collections locally
# Collections are located in ../postman/collections with environment ../postman/environments/local.example.environment.yaml
```
