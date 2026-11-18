# District 13 — Point of Sale (POS) & Store Management

A modern, full-stack Point of Sale (POS) and store operations management system for District 13. Built on a **Local-First PWA** architecture and an enterprise-grade **NestJS + Drizzle ORM + PostgreSQL** backend, engineered for low operational overhead, high reliability, and speed.

---

## 🏗️ Monorepo Architecture

```
district-13/
├── frontend/             # Cashier, Admin, & Owner PWA application (React 19, Vite, Tailwind CSS v4, shadcn/ui)
├── backend/              # Core RESTful API engine (NestJS 12, Drizzle ORM, PostgreSQL 16)
├── deploy/               # Caddy reverse proxy & Railway deployment configurations
├── postman/              # API test suites & environment definitions
├── scripts/              # Project initialization & tooling scripts
├── docker-compose.yml    # Local development multi-container stack
└── README.md             # Monorepo documentation
```

---

## 🚀 Quickstart Guide

### Prerequisites

- **Node.js**: `v22.x` or newer
- **npm**: `v10.x` or newer
- **Docker & Docker Desktop** (with WSL 2 integration enabled if on Windows)

### 1. Run the Entire Stack with Docker Compose

Spin up PostgreSQL, the NestJS API, and the Vite Frontend in isolated containers:

```bash
docker compose up -d
```

Services will be accessible at:

- **Frontend PWA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000` (Health Check: `http://localhost:3000/health`)
- **PostgreSQL**: `localhost:5432` (db: `district13`, user: `postgres`, password: `postgres_password`)

### 2. Database Migration & Sample Data Seeding

Run migrations and populate the database with initial synthetic demo data:

```bash
# Apply schema migrations
docker compose exec api npm run db:migrate:run

# Seed sample catalog, store categories, cashier, and inventory stock
docker compose exec api npm run db:seed
```

### 3. Default Login Credentials

Once seeded, use these accounts to sign in at `http://localhost:5173`:

- **Owner**: `owner` / `password123`
- **Admin**: `admin` / `password123`
- **Cashier**: `kasir` / `password123`

---

## 📱 Cashier Tablet Access via Local Network (LAN / Wi-Fi)

The Vite frontend server is configured to bind to `0.0.0.0:5173`, enabling access from tablets (Android / iPad) on the same Wi-Fi network:

1. Connect the host computer and tablet to the same local Wi-Fi.
2. Find the host computer's local IP address:
   - **Linux / macOS**: `hostname -I | awk '{print $1}'` or `ifconfig`
   - **Windows (PowerShell)**: `ipconfig` (check IPv4 Address)
3. Open Google Chrome on the tablet and navigate to:
   ```
   http://<HOST_IP_ADDRESS>:5173
   ```
4. Select **"Install App"** or **"Add to Home Screen"** for full-screen PWA mode. All cashier action buttons are optimized with touch targets ≥ 44px.

---

## 🛠️ Monorepo Command Reference

| Command               | Description                                                         |
| :-------------------- | :------------------------------------------------------------------ |
| `npm run lint`        | Runs Oxlint across both frontend and backend (0 errors)             |
| `npm run typecheck`   | Strict TypeScript validation across all workspaces (`tsc --noEmit`) |
| `npm test`            | Executes backend Vitest unit & integration test suites              |
| `npm run build`       | Builds production bundles for frontend and backend                  |
| `npm run docker:up`   | Starts all Docker Compose services in the background                |
| `npm run docker:down` | Stops and removes Docker Compose containers                         |
| `npm run db:seed`     | Populates the database with synthetic demo data                     |

---

## 📚 Co-located Module Documentation

For detailed architectural and developer guides, consult each module's respective documentation:

- **[Backend & Database Module](backend/README.md)**: API `/api/v1` standards, SDD 6.7 error format, Pino JSON logging, `X-Request-Id` tracing, health endpoints, and Drizzle migrations.
- **[Frontend PWA Module](frontend/README.md)**: React 19 architecture, currency & WIB date formatters, Web App Manifest, and cashier touch ergonomical standards.
- **[CI & Automation Module](.github/workflows/README.md)**: Continuous integration quality gates, npm caching, and branch protection requirements.
- **[Deployment & Infrastructure Module](deploy/README.md)**: Docker Compose setup, Caddy reverse proxy TLS, and cloud infrastructure budgeting (< Rp 250,000/month).
