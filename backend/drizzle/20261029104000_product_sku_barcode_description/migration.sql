ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" varchar(50);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" varchar(50);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" numeric(10, 2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "charge_tax" boolean DEFAULT false NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "in_stock" boolean DEFAULT true NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'published' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_cost_price_nonnegative'
  ) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_cost_price_nonnegative" CHECK ("cost_price" IS NULL OR "cost_price" >= 0);
  END IF;
END $$;
