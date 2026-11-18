-- T-13: Shifts & Cash Entries
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY,
  cashier_id uuid NOT NULL REFERENCES users(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  status shift_status NOT NULL DEFAULT 'open',
  opening_cash bigint NOT NULL CHECK (opening_cash >= 0),
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,
  expected_cash bigint,
  counted_cash bigint CHECK (counted_cash IS NULL OR counted_cash >= 0),
  cash_difference bigint,
  closing_withdrawal bigint CHECK (closing_withdrawal IS NULL OR closing_withdrawal >= 0),
  closed_by uuid REFERENCES users(id),
  close_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shifts_closed_fields CHECK (
    status = 'open'
    OR (closed_at IS NOT NULL AND expected_cash IS NOT NULL AND counted_cash IS NOT NULL
        AND cash_difference IS NOT NULL AND closing_withdrawal IS NOT NULL AND closed_by IS NOT NULL)
  ),
  CONSTRAINT shifts_close_time CHECK (closed_at IS NULL OR closed_at >= opened_at)
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS shifts_updated_at ON shifts;
CREATE TRIGGER shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shifts_one_open_per_store_idx ON shifts ((status)) WHERE status = 'open';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS shifts_one_open_per_cashier_idx ON shifts (cashier_id) WHERE status = 'open';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shifts_cashier_idx ON shifts (cashier_id, opened_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS shifts_opened_at_idx ON shifts (opened_at DESC);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_shift_lock() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'closed' THEN
    RAISE EXCEPTION 'SHIFT_CLOSED: shift % sudah ditutup dan tidak dapat diubah', OLD.id USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS shifts_lock ON shifts;
CREATE TRIGGER shifts_lock BEFORE UPDATE OR DELETE ON shifts FOR EACH ROW EXECUTE FUNCTION trg_shift_lock();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_require_cashier() RETURNS trigger AS $$
DECLARE r user_role;
BEGIN
  SELECT role INTO r FROM users WHERE id = NEW.cashier_id;
  IF r::text NOT IN ('cashier', 'CASHIER') THEN
    RAISE EXCEPTION 'FORBIDDEN: hanya Kasir yang dapat membuka shift atau membuat penjualan' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS shifts_require_cashier ON shifts;
CREATE TRIGGER shifts_require_cashier BEFORE INSERT ON shifts FOR EACH ROW EXECUTE FUNCTION trg_require_cashier();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cash_entries (
  id uuid PRIMARY KEY,
  shift_id uuid NOT NULL REFERENCES shifts(id),
  type cash_entry_type NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  reason text,
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cash_entries_reason_required
    CHECK (type = 'closing_withdrawal' OR (reason IS NOT NULL AND length(trim(reason)) > 0))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cash_entries_shift_idx ON cash_entries (shift_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS cash_entries_updated_at ON cash_entries;
CREATE TRIGGER cash_entries_updated_at BEFORE UPDATE ON cash_entries FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_cash_entry_shift_open() RETURNS trigger AS $$
DECLARE s shift_status;
BEGIN
  SELECT status INTO s FROM shifts WHERE id = NEW.shift_id;
  IF s = 'closed' THEN
    RAISE EXCEPTION 'SHIFT_CLOSED: tidak dapat menambah catatan kas pada shift tertutup' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cash_entries_shift_open ON cash_entries;
CREATE TRIGGER cash_entries_shift_open BEFORE INSERT ON cash_entries FOR EACH ROW EXECUTE FUNCTION trg_cash_entry_shift_open();
