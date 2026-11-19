import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { DiscountsService } from './discounts.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let mockDb: any;
  let mockAudit: any;

  const ownerUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'OWNER',
    sessionId: 'sess-1',
  };

  beforeEach(async () => {
    mockDb = {
      db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create discount and log DISCOUNT_CREATED audit', async () => {
    // findByCode returns none
    mockDb.db.select = vi.fn().mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const mockCreated = {
      id: 'disc-1',
      name: 'Diskon Akhir Pekan',
      code: 'WEEKEND10',
      type: 'percentage',
      value: '10',
      isActive: true,
    };

    mockDb.db.insert = vi.fn().mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([mockCreated]),
      }),
    });

    const result = await service.create(
      {
        name: 'Diskon Akhir Pekan',
        code: 'WEEKEND10',
        type: 'percentage',
        value: 10,
      },
      ownerUser,
    );

    expect(result.id).toBe('disc-1');
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DISCOUNT_CREATED',
        entityType: 'DISCOUNT',
        entityId: 'disc-1',
      }),
    );
  });

  it('should reject creating discount with duplicate promo code', async () => {
    mockDb.db.select = vi.fn().mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi
            .fn()
            .mockResolvedValueOnce([{ id: 'disc-exist', code: 'EXIST10' }]),
        }),
      }),
    });

    await expect(
      service.create(
        {
          name: 'Diskon Duplikat',
          code: 'EXIST10',
          type: 'percentage',
          value: 10,
        },
        ownerUser,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
