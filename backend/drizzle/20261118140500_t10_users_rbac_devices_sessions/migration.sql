-- T-10: Users, Permissions, Role Permissions, Devices, Sessions
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE CHECK (username = lower(username)),
  password_hash text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
      ALTER TABLE users ADD COLUMN full_name text NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'failed_login_count') THEN
      ALTER TABLE users ADD COLUMN failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'locked_until') THEN
      ALTER TABLE users ADD COLUMN locked_until timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_activity_at') THEN
      ALTER TABLE users ADD COLUMN last_activity_at timestamptz;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permissions (
  code text PRIMARY KEY,
  description text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role NOT NULL,
  permission_code text NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_code)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS devices_updated_at ON devices;
CREATE TRIGGER devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'device_id') THEN
      ALTER TABLE sessions ADD COLUMN device_id uuid REFERENCES devices(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
