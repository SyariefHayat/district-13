ALTER TABLE "transactions"
	ADD COLUMN "transaction_number" varchar(30),
	ADD COLUMN "subtotal_amount" numeric(10, 2),
	ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT 0,
	ADD COLUMN "discount_reason" varchar(255),
	ADD COLUMN "paid_amount" numeric(10, 2),
	ADD COLUMN "change_amount" numeric(10, 2),
	ADD COLUMN "void_reason" varchar(255);
--> statement-breakpoint
WITH numbered AS (
	SELECT "id", row_number() OVER (ORDER BY "id") AS "legacy_number"
	FROM "transactions"
)
UPDATE "transactions" AS transaction_row SET
	"transaction_number" = 'D13-LEGACY-' || lpad(numbered."legacy_number"::text, 19, '0'),
	"subtotal_amount" = "total_amount",
	"discount_amount" = 0,
	"paid_amount" = "total_amount",
	"change_amount" = 0
FROM numbered
WHERE transaction_row."id" = numbered."id";
--> statement-breakpoint
ALTER TABLE "transactions"
	ALTER COLUMN "transaction_number" SET NOT NULL,
	ALTER COLUMN "subtotal_amount" SET NOT NULL,
	ALTER COLUMN "discount_amount" SET NOT NULL,
	ALTER COLUMN "paid_amount" SET NOT NULL,
	ALTER COLUMN "change_amount" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_number_unique" UNIQUE ("transaction_number");
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amounts_nonnegative"
	CHECK ("subtotal_amount" >= 0 AND "discount_amount" >= 0 AND "total_amount" >= 0 AND "paid_amount" >= 0 AND "change_amount" >= 0);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_discount_lte_subtotal"
	CHECK ("discount_amount" <= "subtotal_amount");
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_total_consistent"
	CHECK ("total_amount" = "subtotal_amount" - "discount_amount");
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_consistent"
	CHECK (("payment_method" = 'CASH' AND "paid_amount" >= "total_amount" AND "change_amount" = "paid_amount" - "total_amount") OR ("payment_method" = 'QRIS' AND "paid_amount" = "total_amount" AND "change_amount" = 0));
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL REFERENCES "transactions"("id"),
	"product_id" uuid NOT NULL REFERENCES "products"("id"),
	"product_name" varchar(120) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal_amount" numeric(10, 2) NOT NULL,
	CONSTRAINT "transaction_items_quantity_positive" CHECK ("quantity" > 0),
	CONSTRAINT "transaction_items_amounts_nonnegative" CHECK ("unit_price" >= 0 AND "subtotal_amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX "transaction_items_transaction_idx" ON "transaction_items" ("transaction_id");
--> statement-breakpoint
CREATE TABLE "transaction_item_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_item_id" uuid NOT NULL REFERENCES "transaction_items"("id"),
	"addon_id" uuid NOT NULL REFERENCES "addons"("id"),
	"addon_name" varchar(100) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "transaction_item_addons_quantity_positive" CHECK ("quantity" > 0),
	CONSTRAINT "transaction_item_addons_price_nonnegative" CHECK ("unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"scope" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"request_hash" char(64) NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"resource_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_keys_user_scope_key_unique" UNIQUE("user_id", "scope", "key")
);
--> statement-breakpoint
CREATE TABLE "transaction_counters" (
	"business_date" date PRIMARY KEY NOT NULL,
	"last_value" integer NOT NULL,
	CONSTRAINT "transaction_counters_last_value_positive" CHECK ("last_value" > 0)
);
--> statement-breakpoint
CREATE TABLE "transaction_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL REFERENCES "transactions"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"event" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys" ("expires_at");
--> statement-breakpoint
ALTER TYPE "inventory_movement_type" ADD VALUE 'VOID_RETURN';
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_transaction_id_transactions_id_fk"
	FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id");
