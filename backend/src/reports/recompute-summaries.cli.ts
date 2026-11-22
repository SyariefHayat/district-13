/**
 * Idempotent summary rebuild script for District 13 (T-52 / REQ: REL-08, RPT-011)
 * Rebuilds daily_sales_summary, daily_product_summary, and daily_cashier_summary from source data.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { DailySummariesService } from './daily-summaries.service.js';

async function bootstrap() {
  console.log(
    '🔄 Memulai proses pembangunan ulang ringkasan harian (recompute-summaries)...',
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const summariesService = app.get(DailySummariesService);

  const argDate = process.argv[2];
  let result: { recomputedDates: string[] };

  if (argDate && /^\d{4}-\d{2}-\d{2}$/.test(argDate)) {
    console.log(
      `📅 Membangun ulang ringkasan untuk tanggal spesifik: ${argDate}`,
    );
    result = await summariesService.recomputeSummaries({ date: argDate });
  } else if (process.argv.includes('--dirty')) {
    console.log(
      '🔍 Membangun ulang ringkasan untuk tanggal kotor (dirty days)...',
    );
    result = await summariesService.recomputeSummaries({ onlyDirty: true });
  } else {
    console.log(
      '🌐 Membangun ulang seluruh ringkasan harian dari nol (all dates)...',
    );
    result = await summariesService.recomputeSummaries({ all: true });
  }

  console.log(
    `✅ Selesai! Tanggal yang diproses (${result.recomputedDates.length}):`,
    result.recomputedDates,
  );
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('❌ Gagal menjalankan recompute-summaries:', err);
  process.exit(1);
});
