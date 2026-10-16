CREATE TYPE "inventory_location" AS ENUM ('WAREHOUSE', 'DISPLAY');
--> statement-breakpoint
CREATE TYPE "inventory_movement_type" AS ENUM ('STOCK_IN', 'TRANSFER', 'SALE');
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL REFERENCES "products"("id"),
	"location" "inventory_location" NOT NULL,
	"stock" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventories_product_id_location_unique" UNIQUE("product_id", "location")
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL REFERENCES "products"("id"),
	"from_location" "inventory_location",
	"to_location" "inventory_location",
	"type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
