import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, '../drizzle');

describe('Database Migrations Verification (T-09 to T-15 / Issues #32-#38)', () => {
  const migrations = readMigrationFiles({ migrationsFolder });

  it('successfully loads and parses all migrations including the canonical P0 database epic', () => {
    expect(migrations.length).toBeGreaterThanOrEqual(24);

    const migrationNames = migrations.map((m) => m.name);
    expect(migrationNames).toContain(
      '20261118140000_t09_base_extensions_enums',
    );
    expect(migrationNames).toContain(
      '20261118140500_t10_users_rbac_devices_sessions',
    );
    expect(migrationNames).toContain(
      '20261118141000_t11_catalog_categories_products',
    );
    expect(migrationNames).toContain(
      '20261118141500_t12_stock_and_movements_append_only',
    );
    expect(migrationNames).toContain(
      '20261118142000_t13_shifts_and_cash_entries',
    );
    expect(migrationNames).toContain('20261118142500_t14_sales_items_voids');
    expect(migrationNames).toContain(
      '20261118143000_t15_schedules_settings_audit_derived_roles',
    );
  });

  it('T-09 (#32): includes pg_trgm extension, custom ENUMs and immutable append-only trigger function', () => {
    const t09 = migrations.find((m) =>
      m.name.includes('20261118140000_t09_base_extensions_enums'),
    )!;
    const combinedSql = t09.sql.join('\n');

    expect(combinedSql).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    expect(combinedSql).toContain('user_role');
    expect(combinedSql).toContain('stock_movement_type');
    expect(combinedSql).toContain('shift_status');
    expect(combinedSql).toContain('tax_mode');
    expect(combinedSql).toContain('audit_level');
    expect(combinedSql).toContain('master_updated_seq');
    expect(combinedSql).toContain('FUNCTION trg_set_updated_at');
    expect(combinedSql).toContain('FUNCTION trg_set_updated_meta');
    expect(combinedSql).toContain('FUNCTION trg_append_only');
    expect(combinedSql).toContain(
      "RAISE EXCEPTION 'Tabel % bersifat append-only: % ditolak'",
    );
  });

  it('T-10 (#33): includes users lowercase constraint, permissions, role_permissions and devices', () => {
    const t10 = migrations.find((m) =>
      m.name.includes('20261118140500_t10_users_rbac_devices_sessions'),
    )!;
    const combinedSql = t10.sql.join('\n');

    expect(combinedSql).toContain('username = lower(username)');
    expect(combinedSql).toContain(
      'failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0)',
    );
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS permissions');
    expect(combinedSql).toContain(
      'CREATE TABLE IF NOT EXISTS role_permissions',
    );
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS devices');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS sessions');
  });

  it('T-11 (#34): includes product catalog, trigram gin index, updated_seq and price checks', () => {
    const t11 = migrations.find((m) =>
      m.name.includes('20261118141000_t11_catalog_categories_products'),
    )!;
    const combinedSql = t11.sql.join('\n');

    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS brands');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS addons');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS discounts');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS products');
    expect(combinedSql).toContain(
      'products_name_trgm_idx ON products USING gin (name gin_trgm_ops)',
    );
    expect(combinedSql).toContain('CHECK (cost_price >= 0)');
    expect(combinedSql).toContain('CHECK (sale_price >= 0)');
  });

  it('T-12 (#35): enforces separate warehouse/display stock, auto-init stock trigger, and append-only stock_movements', () => {
    const t12 = migrations.find((m) =>
      m.name.includes('20261118141500_t12_stock_and_movements_append_only'),
    )!;
    const combinedSql = t12.sql.join('\n');

    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS stock');
    expect(combinedSql).toContain(
      'warehouse_qty integer NOT NULL DEFAULT 0 CHECK (warehouse_qty >= 0)',
    );
    expect(combinedSql).toContain('display_qty integer NOT NULL DEFAULT 0');
    expect(combinedSql).toContain('CREATE OR REPLACE FUNCTION trg_init_stock');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS stock_movements');
    expect(combinedSql).toContain(
      'stock_movements_append_only BEFORE UPDATE OR DELETE ON stock_movements',
    );
    expect(combinedSql).toContain(
      'stock_movements_no_truncate BEFORE TRUNCATE ON stock_movements',
    );
  });

  it('T-13 (#36): enforces only one open shift across store and locks closed shifts', () => {
    const t13 = migrations.find((m) =>
      m.name.includes('20261118142000_t13_shifts_and_cash_entries'),
    )!;
    const combinedSql = t13.sql.join('\n');

    expect(combinedSql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS shifts_one_open_per_store_idx ON shifts ((status)) WHERE status = 'open'",
    );
    expect(combinedSql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS shifts_one_open_per_cashier_idx ON shifts (cashier_id) WHERE status = 'open'",
    );
    expect(combinedSql).toContain('FUNCTION trg_shift_lock');
    expect(combinedSql).toContain('FUNCTION trg_require_cashier');
    expect(combinedSql).toContain('FUNCTION trg_cash_entry_shift_open');
  });

  it('T-14 (#37): enforces client-idempotent sales, cash calculation, and cashier-only voids on open shifts', () => {
    const t14 = migrations.find((m) =>
      m.name.includes('20261118142500_t14_sales_items_voids'),
    )!;
    const combinedSql = t14.sql.join('\n');

    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS sales');
    expect(combinedSql).toContain('CONSTRAINT sales_cash_fields CHECK');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS sale_items');
    expect(combinedSql).toContain(
      'CREATE TABLE IF NOT EXISTS sale_item_addons',
    );
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS sale_voids');
    expect(combinedSql).toContain('FUNCTION trg_void_rules');
    expect(combinedSql).toContain(
      'VOID_NOT_ALLOWED: hanya kasir pemilik transaksi yang dapat void',
    );
  });

  it('T-15 (#38): seeds initial shift types, store settings, audit log append-only triggers, and configures pos_app role', () => {
    const t15 = migrations.find((m) =>
      m.name.includes(
        '20261118143000_t15_schedules_settings_audit_derived_roles',
      ),
    )!;
    const combinedSql = t15.sql.join('\n');

    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS shift_types');
    expect(combinedSql).toContain("'S1', 'Shift 1 Pagi'");
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS store_settings');
    expect(combinedSql).toContain("'store_name', '\"District 13\"'");
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS audit_logs');
    expect(combinedSql).toContain(
      'audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs',
    );
    expect(combinedSql).toContain('CREATE ROLE pos_app NOLOGIN');
    expect(combinedSql).toContain(
      'REVOKE UPDATE, DELETE, TRUNCATE ON stock_movements, audit_logs FROM pos_app',
    );
  });
});
