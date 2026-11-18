-- T-09: Extensions, ENUMs & Base Functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'cashier');
  ELSE
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'owner';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier';
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE discount_type AS ENUM ('nominal', 'percent');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
    CREATE TYPE stock_movement_type AS ENUM ('sale', 'restock', 'transfer', 'adjustment', 'void');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
    CREATE TYPE shift_status AS ENUM ('open', 'closed');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_entry_type') THEN
    CREATE TYPE cash_entry_type AS ENUM ('in', 'out', 'closing_withdrawal');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
    CREATE TYPE sale_status AS ENUM ('completed', 'voided');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_mode') THEN
    CREATE TYPE tax_mode AS ENUM ('exclusive', 'inclusive', 'none');
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_level') THEN
    CREATE TYPE audit_level AS ENUM ('full', 'operational');
  END IF;
END $$;
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS master_updated_seq;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_set_updated_meta() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_seq := nextval('master_updated_seq');
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION trg_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabel % bersifat append-only: % ditolak', TG_TABLE_NAME, TG_OP
  USING ERRCODE = 'P0001';
END $$ LANGUAGE plpgsql;
