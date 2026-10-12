import postgres from 'postgres';
import { env } from '../config/env.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { AppDatabase } from './database.types.js';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

function getDatabaseUrl(): string {
  const databaseUrl = env.databaseUrl;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file.');
  }

  return databaseUrl;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly client: postgres.Sql;

  readonly db: AppDatabase;

  constructor() {
    const databaseUrl = getDatabaseUrl();

    this.client = postgres(databaseUrl, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      // Aktifkan jika menggunakan Supabase Transaction Pooler:
      // prepare: false,
    });

    this.db = drizzle({
      client: this.client,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client`SELECT 1`;

    console.log('Database connected ✅');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end();

    console.log('Database connection closed.');
  }
}
