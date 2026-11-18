# Infrastructure, Cloud Provisioning & Deployment — District 13

This directory houses infrastructure configuration and operational runbooks for both local containerized development and cloud staging/production environments.

---

## ☁️ Staging & Production Cloud Architecture

District 13 is engineered for high availability, security, and low operational overhead:

```
                  ┌──────────────────────┐
                  │    Cashier Tablet    │
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
   - Global Edge CDN static hosting with automated SSL/TLS certificates.
   - SPA rewrite rules defined in `frontend/vercel.json`.
2. **Backend API & Reverse Proxy (Railway + Caddy)**:
   - Caddy handles TLS termination, response compression (zstd/gzip), and security headers.
   - Forwards traffic to the NestJS API service on internal port 3000.
3. **Database (Supabase PostgreSQL 16)**:
   - Managed PostgreSQL database equipped with connection pooling.

---

## 💰 Operational Cloud Budget Verification (Max Rp 250,000 / Month Cap)

In accordance with issue **T-07 (COST-01 & COST-02)**, all cloud service tier costs have been verified:

| Service           | Plan / Tier   | Allocated Resources                                         | Estimated Monthly Cost    |
| :---------------- | :------------ | :---------------------------------------------------------- | :------------------------ |
| **Supabase**      | Free Tier     | 500 MB Database, 2 GB egress/month, automated daily backups | **Rp 0** ($0/month)       |
| **Vercel**        | Hobby Plan    | Reasonable bandwidth, edge CDN, automated SSL               | **Rp 0** ($0/month)       |
| **Railway**       | Hobby Plan    | 512 MB - 1 GB RAM, Shared vCPU for API container            | **~Rp 80,000** ($5/month) |
| **Custom Domain** | .my.id / .com | Annual store domain registration (~Rp 150,000/year)         | **~Rp 12,500** /month     |
| **TOTAL**         |               |                                                             | **~Rp 92,500 / month**    |

> **Conclusion**: The verified actual operational cost is **~Rp 92,500/month**, well below the maximum budget limit of **Rp 250,000/month**.

---

## 🔒 HTTPS & Thermal Bluetooth Printer Requirements

An **HTTPS** connection is mandatory in production because:

1. **Service Workers & PWA**: Modern browsers restrict Service Worker registration to secure origins (`https://` or `http://localhost`).
2. **Web Bluetooth API**: Direct wireless pairing with thermal POS receipt printers (**EPPOS EP-RPP02**) is blocked by browsers when served over unencrypted HTTP.

---

## 💻 Local Cashier Tablet Access via Wi-Fi (LAN)

For local store testing using a tablet without external internet:

1. Ensure both devices are connected to the same local Wi-Fi router.
2. Start the stack with Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Check the host computer's local IP address:
   - Linux: `hostname -I | awk '{print $1}'`
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
4. Open the tablet browser to: `http://<HOST_IP>:5173`.
5. All buttons adhere to ergonomic touch target standards (≥ 44px).
