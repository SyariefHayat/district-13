# Database Backup & Disaster Recovery Architecture (T-62, T-67)

## 1. Architectural Decision: Hourly `pg_dump` vs. PITR / WAL

| Factor                             | Supabase Managed PITR              | Hourly Encrypted `pg_dump` to S3 (Chosen)        |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------ |
| **RPO (Recovery Point Objective)** | Continuous (~seconds)              | $\le 1$ hour (hourly cron execution)             |
| **RTO (Recovery Time Objective)**  | Minutes to hours                   | Minutes (target $\le 1$ day, achieved in < 60s)  |
| **Infrastructure Cost**            | High (Paid plan add-on, \$100+/mo) | Negligible (< \$1/mo on standard S3 bucket)      |
| **Vendor Independence**            | Locked to Supabase infrastructure  | 100% portable PostgreSQL dump to offsite S3      |
| **Security & Encryption**          | Host-level encryption              | Client-side AES-256-CBC encryption before upload |
| **Retention Policy**               | Fixed 7 days on entry tiers        | $\ge 30$ days automated retention management     |

**Decision**: We implement automated hourly `pg_dump` compressed format (`-Fc`), encrypted via AES-256-CBC (PBKDF2 100,000 iterations), streamed to an offsite S3-compatible bucket, with automated purge of archives older than 30 days.

## 2. Recovery Point Objective (RPO)

- Scheduled via GitHub Actions (`.github/workflows/backup.yml`) every hour at minute 0 (`cron: '0 * * * *'`).
- RPO is strictly $\le 1$ hour.
- Any backup failure triggers an immediate alert to the Owner via Discord webhook.

## 3. Recovery Time Objective (RTO)

- Restoration tested via `scripts/backup/restore-test.sh`.
- Full recovery benchmark time recorded in `scripts/backup/RESTORE_BENCHMARK.json`.
- Tested restoration takes < 60 seconds for standard transaction volumes, well under the 24-hour ($RTO \le 1 \text{ day}$) requirement.
