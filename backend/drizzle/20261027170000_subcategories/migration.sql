CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "subcategories_name_valid" CHECK (char_length(btrim("name")) BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX "subcategories_category_id_name_normalized_unique" ON "subcategories" ("category_id", lower(btrim("name")));

ALTER TABLE "products" ADD COLUMN "sub_category_id" uuid REFERENCES "subcategories"("id") ON DELETE SET NULL;
