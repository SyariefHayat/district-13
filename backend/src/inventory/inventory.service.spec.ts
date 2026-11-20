import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockDb: any;
  let mockAudit: any;

  const ownerUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'OWNER',
    sessionId: 'sess-owner',
  };

  const adminUser: AuthenticatedUser = {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'ADMIN',
    sessionId: 'sess-admin',
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
        InventoryService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('restock', () => {
    it('should restock warehouse quantity, insert movement, and log audit', async () => {
      // Mock lockActiveProduct
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            for: vi
              .fn()
              .mockResolvedValueOnce([
                { id: 'prod-1', name: 'Kopi Arabika', isActive: true },
              ]),
          }),
        }),
      });

      // Mock stock insert onConflictDoNothing
      mockDb.db.insert = vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            onConflictDoNothing: vi.fn().mockResolvedValueOnce([]),
          }),
        })
        .mockReturnValueOnce({
          // stockMovements insert
          values: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 1,
                productId: 'prod-1',
                type: 'restock',
                warehouseDelta: 50,
                displayDelta: 0,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          // inventories insert
          values: vi.fn().mockReturnValueOnce({
            onConflictDoUpdate: vi.fn().mockReturnValueOnce({
              returning: vi
                .fn()
                .mockResolvedValueOnce([
                  {
                    id: 'inv-1',
                    productId: 'prod-1',
                    location: 'WAREHOUSE',
                    stock: 50,
                  },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // inventoryMovements insert
          values: vi.fn().mockResolvedValueOnce([]),
        });

      // Mock stock update
      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                productId: 'prod-1',
                warehouseQty: 50,
                displayQty: 0,
                needsReview: false,
                version: 1,
              },
            ]),
          }),
        }),
      });

      const result = await service.restock(
        { productId: 'prod-1', quantity: 50, notes: 'Restock supplier A' },
        ownerUser,
      );

      expect(result.stock.warehouseQty).toBe(50);
      expect(result.movement.type).toBe('restock');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_STOCK_IN',
          entityType: 'INVENTORY',
          entityId: 'prod-1',
        }),
      );
    });

    it('should reject non-positive quantity', async () => {
      await expect(
        service.restock({ productId: 'prod-1', quantity: 0 }, ownerUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transferToDisplay', () => {
    it('should transfer from warehouse to display, decrement warehouse and increment display', async () => {
      // Mock lockActiveProduct
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            for: vi
              .fn()
              .mockResolvedValueOnce([
                { id: 'prod-1', name: 'Kopi Arabika', isActive: true },
              ]),
          }),
        }),
      });

      // Mock stock insert onConflictDoNothing
      mockDb.db.insert = vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            onConflictDoNothing: vi.fn().mockResolvedValueOnce([]),
          }),
        })
        .mockReturnValueOnce({
          // stockMovements insert
          values: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 2,
                productId: 'prod-1',
                type: 'transfer',
                warehouseDelta: -10,
                displayDelta: 10,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          // inventories display insert
          values: vi.fn().mockReturnValueOnce({
            onConflictDoUpdate: vi.fn().mockReturnValueOnce({
              returning: vi
                .fn()
                .mockResolvedValueOnce([
                  {
                    id: 'inv-disp',
                    productId: 'prod-1',
                    location: 'DISPLAY',
                    stock: 10,
                  },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // inventoryMovements insert
          values: vi.fn().mockResolvedValueOnce([]),
        });

      // Mock stock update (conditional update warehouseQty >= 10)
      mockDb.db.update = vi
        .fn()
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              returning: vi.fn().mockResolvedValueOnce([
                {
                  productId: 'prod-1',
                  warehouseQty: 40,
                  displayQty: 10,
                  needsReview: false,
                  version: 2,
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // inventories warehouse update
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              returning: vi
                .fn()
                .mockResolvedValueOnce([
                  {
                    id: 'inv-wh',
                    productId: 'prod-1',
                    location: 'WAREHOUSE',
                    stock: 40,
                  },
                ]),
            }),
          }),
        });

      const result = await service.transferToDisplay(
        { productId: 'prod-1', quantity: 10 },
        adminUser,
      );

      expect(result.stock.warehouseQty).toBe(40);
      expect(result.stock.displayQty).toBe(10);
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_TRANSFERRED',
          entityType: 'INVENTORY',
          entityId: 'prod-1',
        }),
      );
    });

    it('should throw BadRequestException if warehouse stock is insufficient', async () => {
      // Mock lockActiveProduct
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            for: vi
              .fn()
              .mockResolvedValueOnce([
                { id: 'prod-1', name: 'Kopi Arabika', isActive: true },
              ]),
          }),
        }),
      });

      mockDb.db.insert = vi.fn().mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          onConflictDoNothing: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      // Stock update returns empty (0 rows affected because warehouseQty < quantity)
      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      await expect(
        service.transferToDisplay(
          { productId: 'prod-1', quantity: 999 },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('adjust', () => {
    it('should adjust physical stock, require reason, calculate delta, and log audit', async () => {
      // Mock lockActiveProduct
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi
                .fn()
                .mockResolvedValueOnce([
                  { id: 'prod-1', name: 'Kopi Arabika', isActive: true },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // select currentStock
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi.fn().mockResolvedValueOnce([
                {
                  productId: 'prod-1',
                  warehouseQty: 40,
                  displayQty: 10,
                  needsReview: false,
                  version: 2,
                },
              ]),
            }),
          }),
        });

      mockDb.db.insert = vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            onConflictDoNothing: vi.fn().mockResolvedValueOnce([]),
          }),
        })
        .mockReturnValueOnce({
          // stockMovements insert
          values: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 3,
                productId: 'prod-1',
                type: 'adjustment',
                warehouseDelta: 0,
                displayDelta: -2,
                reason: 'Penghitungan fisik mingguan: 2 cup tumpah',
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          // inventories insert onConflictDoUpdate
          values: vi.fn().mockReturnValueOnce({
            onConflictDoUpdate: vi.fn().mockResolvedValueOnce([]),
          }),
        });

      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                productId: 'prod-1',
                warehouseQty: 40,
                displayQty: 8,
                needsReview: false,
                version: 3,
              },
            ]),
          }),
        }),
      });

      const result = await service.adjust(
        {
          productId: 'prod-1',
          location: 'DISPLAY',
          actualStock: 8,
          reason: 'Penghitungan fisik mingguan: 2 cup tumpah',
        },
        adminUser,
      );

      expect(result.stock.displayQty).toBe(8);
      expect(result.movement.displayDelta).toBe(-2);
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_ADJUSTED',
          entityType: 'INVENTORY',
          entityId: 'prod-1',
        }),
      );
    });

    it('should reject adjustment with empty reason', async () => {
      await expect(
        service.adjust(
          {
            productId: 'prod-1',
            location: 'DISPLAY',
            actualStock: 5,
            reason: '   ',
          },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('review flags', () => {
    it('should list products with needsReview=true or negative displayQty', async () => {
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          innerJoin: vi.fn().mockReturnValueOnce({
            leftJoin: vi.fn().mockReturnValueOnce({
              where: vi.fn().mockReturnValueOnce({
                orderBy: vi.fn().mockResolvedValueOnce([
                  {
                    productId: 'prod-neg',
                    productName: 'Kopi Defisit',
                    warehouseQty: 5,
                    displayQty: -3,
                    deficit: 3,
                    needsReview: true,
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      const flags = await service.getReviewFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0].deficit).toBe(3);
    });

    it('should resolve review flag and log audit', async () => {
      // Mock lockActiveProduct
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi
                .fn()
                .mockResolvedValueOnce([
                  { id: 'prod-neg', name: 'Kopi Defisit', isActive: true },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // select currentStock
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi.fn().mockResolvedValueOnce([
                {
                  productId: 'prod-neg',
                  warehouseQty: 5,
                  displayQty: -3,
                  needsReview: true,
                  version: 1,
                },
              ]),
            }),
          }),
        });

      mockDb.db.insert = vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn().mockResolvedValueOnce([]), // stockMovements
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            onConflictDoUpdate: vi.fn().mockResolvedValueOnce([]), // inventories
          }),
        });

      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                productId: 'prod-neg',
                warehouseQty: 5,
                displayQty: 0,
                needsReview: false,
                version: 2,
              },
            ]),
          }),
        }),
      });

      const resolved = await service.resolveReviewFlag(
        'prod-neg',
        { targetDisplayStock: 0, notes: 'Stok fisik dihitung ulang' },
        ownerUser,
      );

      expect(resolved.needsReview).toBe(false);
      expect(resolved.displayQty).toBe(0);
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INVENTORY_REVIEW_RESOLVED',
          entityType: 'INVENTORY',
          entityId: 'prod-neg',
        }),
      );
    });
  });
});
