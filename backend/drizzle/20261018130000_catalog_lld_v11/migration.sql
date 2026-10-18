ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "is_available" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories"
  ALTER COLUMN "name" TYPE varchar(100);
--> statement-breakpoint
ALTER TABLE "products"
  ALTER COLUMN "name" TYPE varchar(120);
--> statement-breakpoint
ALTER TABLE "addons"
  ALTER COLUMN "name" TYPE varchar(100);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_normalized_unique"
  ON "categories" (lower(btrim("name")));
