-- T-11: Categories, Brands, Addons, Discounts, Products
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'updated_seq') THEN
      ALTER TABLE categories ADD COLUMN updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq');
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS categories_meta ON categories;
CREATE TRIGGER categories_meta BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS categories_updated_seq_idx ON categories (updated_seq);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS brands_meta ON brands;
CREATE TRIGGER brands_meta BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS brands_updated_seq_idx ON brands (updated_seq);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price bigint NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addons' AND column_name = 'updated_seq') THEN
      ALTER TABLE addons ADD COLUMN updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq');
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS addons_meta ON addons;
CREATE TRIGGER addons_meta BEFORE UPDATE ON addons FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS addons_updated_seq_idx ON addons (updated_seq);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type discount_type NOT NULL,
  value bigint NOT NULL CHECK (value > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq'),
  CONSTRAINT discounts_percent_max CHECK (type <> 'percent' OR value <= 100)
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discounts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discounts' AND column_name = 'updated_seq') THEN
      ALTER TABLE discounts ADD COLUMN updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq');
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS discounts_meta ON discounts;
CREATE TRIGGER discounts_meta BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS discounts_updated_seq_idx ON discounts (updated_seq);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  barcode text UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES categories(id),
  brand_id uuid REFERENCES brands(id),
  unit text NOT NULL DEFAULT 'pcs',
  cost_price bigint NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price bigint NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq')
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand_id') THEN
      ALTER TABLE products ADD COLUMN brand_id uuid REFERENCES brands(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'unit') THEN
      ALTER TABLE products ADD COLUMN unit text NOT NULL DEFAULT 'pcs';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sale_price') THEN
      ALTER TABLE products ADD COLUMN sale_price bigint NOT NULL DEFAULT 0 CHECK (sale_price >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'min_stock') THEN
      ALTER TABLE products ADD COLUMN min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_seq') THEN
      ALTER TABLE products ADD COLUMN updated_seq bigint NOT NULL DEFAULT nextval('master_updated_seq');
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS products_meta ON products;
CREATE TRIGGER products_meta BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trg_set_updated_meta();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_updated_seq_idx ON products (updated_seq);
