-- T-14: Sales, Sale Items, Sale Item Addons, Sale Voids
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY,
  receipt_no text NOT NULL UNIQUE,
  queue_no text,
  shift_id uuid NOT NULL REFERENCES shifts(id),
  cashier_id uuid NOT NULL REFERENCES users(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  status sale_status NOT NULL DEFAULT 'completed',
  subtotal bigint NOT NULL CHECK (subtotal >= 0),
  discount_id uuid REFERENCES discounts(id),
  discount_name text,
  discount_amount bigint NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_mode tax_mode NOT NULL,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount bigint NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total bigint NOT NULL CHECK (total >= 0),
  payment_method payment_method NOT NULL,
  cash_received bigint CHECK (cash_received IS NULL OR cash_received >= 0),
  change_amount bigint CHECK (change_amount IS NULL OR change_amount >= 0),
  created_at_client timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  business_date date NOT NULL,
  is_offline boolean NOT NULL DEFAULT false,
  late_sync_flag boolean NOT NULL DEFAULT false,
  clock_skew_flag boolean NOT NULL DEFAULT false,
  CONSTRAINT sales_cash_fields CHECK (
    (payment_method = 'cash' AND cash_received IS NOT NULL AND change_amount IS NOT NULL
     AND cash_received >= total AND change_amount = cash_received - total)
    OR (payment_method <> 'cash' AND cash_received IS NULL AND change_amount IS NULL)
  ),
  CONSTRAINT sales_discount_snapshot CHECK (discount_id IS NULL OR discount_name IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sales_business_date_idx ON sales (business_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sales_shift_idx ON sales (shift_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sales_cashier_date_idx ON sales (cashier_id, business_date);
--> statement-breakpoint
DROP TRIGGER IF EXISTS sales_require_cashier ON sales;
CREATE TRIGGER sales_require_cashier BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION trg_require_cashier();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_sale_shift_open() RETURNS trigger AS $$
DECLARE s RECORD;
BEGIN
  SELECT status, closed_at INTO s FROM shifts WHERE id = NEW.shift_id;
  IF s.status = 'closed' THEN
    IF NEW.is_offline AND NEW.created_at_client <= s.closed_at THEN
      NEW.late_sync_flag := true;
    ELSE
      RAISE EXCEPTION 'SHIFT_CLOSED: shift % sudah ditutup', NEW.shift_id USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS sales_shift_open ON sales;
CREATE TRIGGER sales_shift_open BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION trg_sale_shift_open();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  sku text NOT NULL,
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  cost_price bigint NOT NULL CHECK (cost_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total bigint NOT NULL CHECK (line_total >= 0),
  business_date date NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON sale_items (sale_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sale_items_date_product_idx ON sale_items (business_date, product_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sale_item_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id uuid NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id),
  name text NOT NULL,
  price bigint NOT NULL CHECK (price >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sale_item_addons_item_idx ON sale_item_addons (sale_item_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sale_voids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL UNIQUE REFERENCES sales(id),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  voided_by uuid NOT NULL REFERENCES users(id),
  voided_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_void_rules() RETURNS trigger AS $$
DECLARE s RECORD;
BEGIN
  SELECT sa.cashier_id, sa.status AS sale_status, sh.status AS shift_status
  INTO s FROM sales sa JOIN shifts sh ON sh.id = sa.shift_id
  WHERE sa.id = NEW.sale_id;
  IF s.cashier_id IS DISTINCT FROM NEW.voided_by THEN
    RAISE EXCEPTION 'VOID_NOT_ALLOWED: hanya kasir pemilik transaksi yang dapat void' USING ERRCODE = 'P0001';
  END IF;
  IF s.shift_status <> 'open' THEN
    RAISE EXCEPTION 'VOID_NOT_ALLOWED: shift transaksi sudah ditutup' USING ERRCODE = 'P0001';
  END IF;
  IF s.sale_status = 'voided' THEN
    RAISE EXCEPTION 'VOID_NOT_ALLOWED: transaksi sudah di-void' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS sale_voids_rules ON sale_voids;
CREATE TRIGGER sale_voids_rules BEFORE INSERT ON sale_voids FOR EACH ROW EXECUTE FUNCTION trg_void_rules();
