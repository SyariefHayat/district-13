import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { MaintenanceService } from './maintenance.service.js';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const maintenanceService = app.get(MaintenanceService);
  const report = await maintenanceService.runNightlyMaintenance(true);

  console.log('--- Maintenance Report ---');
  console.log(JSON.stringify(report, null, 2));

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Maintenance execution failed:', err);
  process.exit(1);
});
