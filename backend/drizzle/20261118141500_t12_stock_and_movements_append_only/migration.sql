-- T-12: Stock & Append-Only Stock Movements
CREATE TABLE IF NOT EXISTS stock (
  product_id uuid PRIMARY KEY REFERENCES products(id),
  warehouse_qty integer NOT NULL DEFAULT 0 CHECK (warehouse_qty >= 0),
  display_qty integer NOT NULL DEFAULT 0,
  needs_review boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS stock_meta ON stock;
CREATE TRIGGER stock_meta BEFORE UPDATE ON stock FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_review_idx ON stock (product_id) WHERE needs_review;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_updated_seq_idx ON stock (updated_seq);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_init_stock() RETURNS trigger AS $$
BEGIN
  INSERT INTO stock (product_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS products_init_stock ON products;
CREATE TRIGGER products_init_stock AFTER INSERT ON products FOR EACH ROW EXECUTE FUNCTION trg_init_stock();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS stock_movements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  type stock_movement_type NOT NULL,
  warehouse_delta integer NOT NULL DEFAULT 0,
  display_delta integer NOT NULL DEFAULT 0,
  ref_type text,
  ref_id uuid,
  reason text,
  actor_id uuid NOT NULL REFERENCES users(id),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_movements_adjust_reason
    CHECK (type <> 'adjustment' OR (reason IS NOT NULL AND length(trim(reason)) > 0))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements (product_id, occurred_at DESC);
--> statement-breakpoint
DROP TRIGGER IF EXISTS stock_movements_append_only ON stock_movements;
CREATE TRIGGER stock_movements_append_only BEFORE UPDATE OR DELETE ON stock_movements FOR EACH ROW EXECUTE FUNCTION trg_append_only();
--> statement-breakpoint
DROP TRIGGER IF EXISTS stock_movements_no_truncate ON stock_movements;
CREATE TRIGGER stock_movements_no_truncate BEFORE TRUNCATE ON stock_movements FOR EACH STATEMENT EXECUTE FUNCTION trg_append_only();
