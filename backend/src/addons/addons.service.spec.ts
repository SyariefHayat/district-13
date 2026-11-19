import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { AddonsService } from './addons.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('AddonsService', () => {
  let service: AddonsService;
  let mockDb: any;
  let mockAudit: any;

  const ownerUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'OWNER',
    sessionId: 'sess-1',
  };

  const adminUser: AuthenticatedUser = {
    id: '33333333-3333-3333-3333-333333333333',
    role: 'ADMIN',
    sessionId: 'sess-3',
  };

  beforeEach(async () => {
    mockDb = {
      db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn(async (cb) => cb(mockDb.db)),
      },
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddonsService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AddonsService>(AddonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePrice', () => {
    it('should reject price update if user is not OWNER', async () => {
      await expect(
        service.updatePrice('addon-1', '5000', adminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update price and log audit', async () => {
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi
              .fn()
              .mockResolvedValueOnce([
                {
                  id: 'addon-1',
                  name: 'Extra Shot Espresso',
                  price: '4000.00',
                  isActive: true,
                },
              ]),
          }),
        }),
      });

      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi
              .fn()
              .mockResolvedValueOnce([
                {
                  id: 'addon-1',
                  name: 'Extra Shot Espresso',
                  price: '5000.00',
                  isActive: true,
                },
              ]),
          }),
        }),
      });

      const result = await service.updatePrice('addon-1', '5000', ownerUser);
      expect(result.price).toBe('5000.00');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADDON_UPDATED',
          entityType: 'ADDON',
          entityId: 'addon-1',
        }),
      );
    });
  });
});
