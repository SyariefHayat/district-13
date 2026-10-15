ALTER TABLE "categories" ADD CONSTRAINT "categories_name_valid"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 100);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_name_valid"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 120);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_nonnegative"
  CHECK ("price" >= 0);
--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_name_valid"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 100);
--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_price_nonnegative"
  CHECK ("price" >= 0);
