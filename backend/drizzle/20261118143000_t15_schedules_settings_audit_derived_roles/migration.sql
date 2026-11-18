-- T-15: Shift Types, Schedules, Store Settings, Queue Counters, Audit Logs, Derived Tables & pos_app Role
CREATE TABLE IF NOT EXISTS shift_types (
  code varchar(2) PRIMARY KEY,
  name varchar(100) NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0)
);
--> statement-breakpoint
INSERT INTO shift_types (code, name, start_time, duration_minutes) VALUES
  ('S1', 'Shift 1 Pagi', '07:00', 540),
  ('S2', 'Shift 2 Sore', '15:00', 540),
  ('S3', 'Shift 3 Malam', '23:00', 540)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  start_time = EXCLUDED.start_time,
  duration_minutes = EXCLUDED.duration_minutes;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  shift_type_code varchar(2) NOT NULL REFERENCES shift_types(code),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedules_user_date_shift_unique UNIQUE (user_id, work_date, shift_type_code)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS schedules_work_date_idx ON schedules (work_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS schedules_user_date_idx ON schedules (user_id, work_date);
--> statement-breakpoint
DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;
CREATE TRIGGER schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS store_settings_meta ON store_settings;
CREATE TRIGGER store_settings_meta BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
INSERT INTO store_settings (key, value) VALUES
  ('store_name', '"District 13"'),
  ('store_address', '""'),
  ('receipt_footer', '""'),
  ('tax_mode', '"none"'),
  ('tax_rate', '0'),
  ('default_min_stock', '0')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS queue_counters (
  device_id uuid NOT NULL REFERENCES devices(id),
  business_date date NOT NULL,
  last_no integer NOT NULL DEFAULT 0 CHECK (last_no >= 0),
  queue_epoch integer NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, business_date)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  level audit_level NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity, entity_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION trg_append_only();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs FOR EACH STATEMENT EXECUTE FUNCTION trg_append_only();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS daily_sales_summary (
  business_date date PRIMARY KEY,
  revenue bigint NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  discount_total bigint NOT NULL DEFAULT 0,
  tax_total bigint NOT NULL DEFAULT 0,
  payment_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS daily_product_summary (
  business_date date NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 0,
  revenue bigint NOT NULL DEFAULT 0,
  cost bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (business_date, product_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS daily_cashier_summary (
  business_date date NOT NULL,
  cashier_id uuid NOT NULL REFERENCES users(id),
  transaction_count integer NOT NULL DEFAULT 0,
  sales_total bigint NOT NULL DEFAULT 0,
  discount_total bigint NOT NULL DEFAULT 0,
  void_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (business_date, cashier_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS dirty_days (
  business_date date PRIMARY KEY,
  marked_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pos_app') THEN
    CREATE ROLE pos_app NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  GRANT USAGE ON SCHEMA public TO pos_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pos_app;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pos_app;
  REVOKE UPDATE, DELETE, TRUNCATE ON stock_movements, audit_logs FROM pos_app;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping pos_app role grant: %', SQLERRM;
END $$;
