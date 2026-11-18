import { describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { TaxMode } from './dto/update-settings.dto.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('SettingsService (SET T-21)', () => {
  const ownerActor: AuthenticatedUser = {
    id: 'owner-uuid-1',
    role: 'OWNER',
    sessionId: 'session-owner-1',
  };

  const adminActor: AuthenticatedUser = {
    id: 'admin-uuid-1',
    role: 'ADMIN',
    sessionId: 'session-admin-1',
  };

  const cashierActor: AuthenticatedUser = {
    id: 'cashier-uuid-1',
    role: 'CASHIER',
    sessionId: 'session-cashier-1',
  };

  it('getSettings: returns structured store settings with defaults', async () => {
    const rows = [
      {
        key: 'store_name',
        value: '"District 13"',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 10,
      },
      {
        key: 'store_address',
        value: '"Jl. Thamrin No. 13"',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 11,
      },
      {
        key: 'tax_mode',
        value: '"inclusive"',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 12,
      },
      {
        key: 'tax_rate',
        value: '11',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 13,
      },
      {
        key: 'default_min_stock',
        value: '5',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 14,
      },
    ];

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn().mockResolvedValue(rows),
      })),
    };

    const database = {
      db: { transaction: (cb: any) => cb(tx) },
    };

    const service = new SettingsService(database as never);
    const settings = await service.getSettings();

    expect(settings.storeName).toBe('District 13');
    expect(settings.storeAddress).toBe('Jl. Thamrin No. 13');
    expect(settings.taxMode).toBe('inclusive');
    expect(settings.taxRate).toBe(11);
    expect(settings.defaultMinStock).toBe(5);
    expect(settings.updatedSeq).toBe(14);
  });

  it('updateSettings: allows Owner to update settings and records audit log (REQ-F-SET-003, AC)', async () => {
    let mockRows = [
      {
        key: 'store_name',
        value: '"District 13"',
        updatedAt: new Date('2026-11-18T10:00:00Z'),
        updatedBy: 'owner-uuid-1',
        updatedSeq: 1,
      },
    ];

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn().mockImplementation(async () => mockRows),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn().mockImplementation(async () => {
            mockRows = [
              {
                key: 'store_name',
                value: '"District 13 New"',
                updatedAt: new Date('2026-11-18T12:00:00Z'),
                updatedBy: 'owner-uuid-1',
                updatedSeq: 2,
              },
            ];
            return [];
          }),
        })),
      })),
    };

    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const database = {
      db: { transaction: (cb: any) => cb(tx) },
    };

    const service = new SettingsService(database as never, auditLogs as never);
    const result = await service.updateSettings(ownerActor, {
      storeName: 'District 13 New',
      taxMode: TaxMode.EXCLUSIVE,
      taxRate: 10,
    });

    expect(result.storeName).toBe('District 13 New');
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STORE_SETTING_UPDATED',
        entityType: 'STORE_SETTING',
        userId: 'owner-uuid-1',
      }),
      expect.anything(),
    );
  });

  it('updateSettings: forbids Admin and Cashier from updating settings (REQ-F-SET-003)', async () => {
    const service = new SettingsService({ db: {} } as never);

    await expect(
      service.updateSettings(adminActor, { storeName: 'Admin Store' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.updateSettings(cashierActor, { storeName: 'Cashier Store' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('devices: handles listing, creation, and conflict detection', async () => {
    const existingDevice = {
      id: 'dev-1',
      code: 'POS-01',
      name: 'Kasir 1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([existingDevice]),
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValueOnce([existingDevice]),
          })),
        })),
      })),
    };

    const service = new SettingsService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    const list = await service.listDevices();
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe('POS-01');

    // Duplicate code throws ConflictException
    await expect(
      service.createDevice(ownerActor, {
        code: 'pos-01',
        name: 'Another Kasir 1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resetQueueCounter: allows Owner to reset queue counter and records audit log (REQ-F-SET-004)', async () => {
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'dev-1',
                code: 'POS-01',
                name: 'Kasir 1',
                isActive: true,
              },
            ]),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                deviceId: 'dev-1',
                businessDate: '2026-11-18',
                lastNo: 0,
                queueEpoch: 1,
              },
            ]),
          })),
        })),
      })),
    };

    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new SettingsService(
      { db: { transaction: (cb: any) => cb(tx) } } as never,
      auditLogs as never,
    );

    const res = await service.resetQueueCounter(ownerActor, {
      deviceId: 'dev-1',
    });

    expect(res.success).toBe(true);
    expect(res.queueEpoch).toBe(1);
    expect(res.lastNo).toBe(0);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'QUEUE_COUNTER_RESET',
        entityType: 'QUEUE_COUNTER',
      }),
      expect.anything(),
    );
  });

  it('resetQueueCounter: forbids Admin and Cashier (REQ-F-SET-004)', async () => {
    const service = new SettingsService({ db: {} } as never);

    await expect(
      service.resetQueueCounter(adminActor, { deviceId: 'dev-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.resetQueueCounter(cashierActor, { deviceId: 'dev-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getNextQueueNumber: allocates formatted queue number per device (SET-004)', async () => {
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi
              .fn()
              .mockResolvedValue([
                { id: 'dev-1', code: 'T1', name: 'Tablet 1', isActive: true },
              ]),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                deviceId: 'dev-1',
                businessDate: '2026-11-18',
                lastNo: 7,
                queueEpoch: 0,
              },
            ]),
          })),
        })),
      })),
    };

    const service = new SettingsService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    const queue = await service.getNextQueueNumber('dev-1', '2026-11-18');
    expect(queue.queueNo).toBe('T1-007');
    expect(queue.lastNo).toBe(7);
  });
});
