import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SyncController } from '../src/sync/sync.controller.js';
import { ReportsController } from '../src/reports/reports.controller.js';
import { ProductsController } from '../src/products/products.controller.js';
import { PinoLoggerService } from '../src/common/logger/pino-logger.service.js';
import * as fs from 'fs';
import * as path from 'path';

describe('T-60 & T-65: Rate Limiting, Security & Caddy Configuration', () => {
  let syncController: SyncController;
  let mockSyncService: any;
  let reportsController: ReportsController;
  let mockReportsService: any;
  let productsController: ProductsController;
  let mockProductsService: any;

  beforeEach(() => {
    mockSyncService = {
      getCatalog: vi.fn(),
      processEvents: vi.fn().mockResolvedValue({ processed: 1 }),
    };
    syncController = new SyncController(mockSyncService);

    mockReportsService = {
      export: vi.fn().mockResolvedValue(undefined),
    };
    reportsController = new ReportsController(mockReportsService);

    mockProductsService = {
      importProducts: vi.fn().mockResolvedValue({ count: 5 }),
    };
    productsController = new ProductsController(mockProductsService);
  });

  describe('Sync Rate Limiting (T-60)', () => {
    it('should reject batch exceeding 50 events with RATE_LIMITED (429)', async () => {
      const mockEvents = Array.from({ length: 51 }, (_, i) => ({
        id: `event-${i}`,
        type: 'TRANSACTION_CREATE' as const,
        timestamp: new Date().toISOString(),
        payload: {},
      }));

      await expect(
        syncController.processEvents(
          { events: mockEvents as any },
          { id: 'user-1', role: 'CASHIER' } as any,
          'device-1',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({
            code: 'RATE_LIMITED',
          }),
        }),
      );
    });

    it('should prevent concurrent sync for the same device code with RATE_LIMITED (429)', async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<{ processed: number }>((resolve) => {
        resolveFirst = () => resolve({ processed: 1 });
      });

      mockSyncService.processEvents.mockReturnValueOnce(firstPromise);

      const run1 = syncController.processEvents(
        {
          events: [
            {
              id: '1',
              type: 'TRANSACTION_CREATE',
              timestamp: '2026-01-01',
              payload: {},
            },
          ] as any,
        },
        { id: 'user-1', role: 'CASHIER' } as any,
        'device-concurrent-test',
      );

      // Second sync on same device while first is running
      await expect(
        syncController.processEvents(
          {
            events: [
              {
                id: '2',
                type: 'TRANSACTION_CREATE',
                timestamp: '2026-01-01',
                payload: {},
              },
            ] as any,
          },
          { id: 'user-1', role: 'CASHIER' } as any,
          'device-concurrent-test',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({
            code: 'RATE_LIMITED',
          }),
        }),
      );

      resolveFirst!();
      await run1;

      // After first completes, next sync should succeed
      mockSyncService.processEvents.mockResolvedValueOnce({ processed: 1 });
      const run3 = await syncController.processEvents(
        { events: [] },
        { id: 'user-1', role: 'CASHIER' } as any,
        'device-concurrent-test',
      );
      expect(run3).toEqual({ processed: 1 });
    });
  });

  describe('Reports Export Rate Limiting (T-60)', () => {
    it('should reject concurrent exports for the same user with RATE_LIMITED (429)', async () => {
      let resolveExport: () => void;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });

      mockReportsService.export.mockReturnValueOnce(exportPromise);

      const user = { id: 'user-export-test', role: 'OWNER' } as any;
      const mockRes = {} as any;

      const runExport1 = reportsController.export(
        'sales',
        {} as any,
        user,
        mockRes,
      );

      await expect(
        reportsController.export('sales', {} as any, user, mockRes),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({
            code: 'RATE_LIMITED',
          }),
        }),
      );

      resolveExport!();
      await runExport1;
    });
  });

  describe('Products Import Rate Limiting (T-60)', () => {
    it('should reject concurrent imports for the same actor with RATE_LIMITED (429)', async () => {
      let resolveImport: () => void;
      const importPromise = new Promise<{ count: number }>((resolve) => {
        resolveImport = () => resolve({ count: 10 });
      });

      mockProductsService.importProducts.mockReturnValueOnce(importPromise);

      const user = { id: 'user-import-test', role: 'OWNER' } as any;

      const runImport1 = productsController.importProducts(
        undefined,
        { csv: 'sku,name\n1,a' },
        user,
      );

      await expect(
        productsController.importProducts(
          undefined,
          { csv: 'sku,name\n2,b' },
          user,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({
            code: 'RATE_LIMITED',
          }),
        }),
      );

      resolveImport!();
      await runImport1;
    });
  });

  describe('Security & Caddyfile Hardening (T-60, T-65)', () => {
    it('should enforce TLS 1.2+ minimum in Caddyfile', () => {
      const caddyPath = path.resolve(process.cwd(), '../deploy/Caddyfile');
      const content = fs.existsSync(caddyPath)
        ? fs.readFileSync(caddyPath, 'utf8')
        : fs.readFileSync(
            path.resolve(process.cwd(), 'deploy/Caddyfile'),
            'utf8',
          );

      expect(content).toContain('protocols tls1.2 tls1.3');
      expect(content).toContain('encode zstd gzip');
      expect(content).toContain('max_size 10MB');
      expect(content).toContain('Strict-Transport-Security');
      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('rate_limit');
      expect(content).toContain('events 300');
    });

    it('should sanitize sensitive tokens, passwords, and PINs in logger (T-65)', () => {
      const logger = new PinoLoggerService();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.log({
        username: 'cashier1',
        password: 'my-super-secret-password',
        pin: '123456',
        token: 'jwt-bearer-token-abc',
        refreshToken: 'refresh-secret-123',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedJson.message.password).toBe('[REDACTED]');
      expect(loggedJson.message.pin).toBe('[REDACTED]');
      expect(loggedJson.message.token).toBe('[REDACTED]');
      expect(loggedJson.message.refreshToken).toBe('[REDACTED]');
      expect(loggedJson.message.username).toBe('cashier1');

      consoleSpy.mockRestore();
    });
  });
});
