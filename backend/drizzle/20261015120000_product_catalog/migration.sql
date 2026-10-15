CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"category_id" uuid NOT NULL REFERENCES "categories"("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL REFERENCES "products"("id"),
	"addon_id" uuid NOT NULL REFERENCES "addons"("id"),
	CONSTRAINT "product_addons_product_id_addon_id_unique" UNIQUE ("product_id", "addon_id")
);
