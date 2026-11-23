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
  private readonly reportingClient: postgres.Sql;

  readonly db: AppDatabase;
  readonly reportingDb: AppDatabase;

  constructor() {
    const databaseUrl = getDatabaseUrl();

    this.client = postgres(databaseUrl, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 15,
      // Supabase connection pooler works best with prepared statements disabled
      prepare: false,
    });

    this.db = drizzle({
      client: this.client,
    });

    // Dedicated connection pool for heavy reporting & analytical workloads
    // Configured with statement_timeout = 5000ms (T-61 / PERF-04)
    this.reportingClient = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 30,
      connect_timeout: 15,
      prepare: false,
      connection: {
        statement_timeout: 5000,
      },
    });

    this.reportingDb = drizzle({
      client: this.reportingClient,
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async pingReporting(): Promise<boolean> {
    try {
      await this.reportingClient`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([this.client`SELECT 1`, this.reportingClient`SELECT 1`]);

    console.log('Database and reporting connection pool connected ✅');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.client.end(), this.reportingClient.end()]);

    console.log('Database connections closed.');
  }
}
