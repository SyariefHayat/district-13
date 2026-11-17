import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Galat: DATABASE_URL tidak terdefinisi.');
    process.exit(1);
  }

  console.log('Menjalankan migrasi Drizzle ORM ke database...');
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle({ client: sql });

  const migrationsFolder = path.resolve(__dirname, '../../drizzle');

  try {
    await migrate(db, { migrationsFolder });
    console.log('Semua migrasi database berhasil diterapkan ✅');
  } catch (error) {
    console.error('Galat saat menjalankan migrasi:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void runMigrations();
