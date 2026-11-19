import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ProductsService } from './products.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockDb: any;
  let mockAudit: any;

  const ownerUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'OWNER',
    sessionId: 'sess-1',
  };

  const cashierUser: AuthenticatedUser = {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'CASHIER',
    sessionId: 'sess-2',
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
        ProductsService,
        {
          provide: InventoryService,
          useValue: {
            getDisplayStock: vi.fn().mockResolvedValue(new Map()),
          },
        },
        { provide: DatabaseService, useValue: mockDb },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create duplicate SKU & Barcode checks', () => {
    it('should throw ConflictException with SKU_DUPLICATE when SKU already exists', async () => {
      // Mock category query -> active category
      // Mock SKU query -> existing product
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi
                .fn()
                .mockResolvedValueOnce([{ id: 'cat-1', isActive: true }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi
                .fn()
                .mockResolvedValueOnce([
                  { id: 'prod-existing', name: 'Kopi Susu Tetangga' },
                ]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            name: 'Kopi Baru',
            price: '15000',
            categoryId: 'cat-1',
            sku: 'SKU-EXISTING',
          },
          ownerUser,
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'SKU_DUPLICATE',
          message:
            "SKU 'SKU-EXISTING' is already used by product 'Kopi Susu Tetangga'",
        },
      });
    });

    it('should throw ConflictException with BARCODE_DUPLICATE when Barcode already exists', async () => {
      // Mock category query -> active category
      // Mock Barcode query (since sku is not provided) -> existing product
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi
                .fn()
                .mockResolvedValueOnce([{ id: 'cat-1', isActive: true }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi
                .fn()
                .mockResolvedValueOnce([
                  { id: 'prod-existing', name: 'Roti Coklat' },
                ]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            name: 'Roti Baru',
            price: '10000',
            categoryId: 'cat-1',
            barcode: '8991234567890',
          },
          ownerUser,
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'BARCODE_DUPLICATE',
          message:
            "Barcode '8991234567890' is already used by product 'Roti Coklat'",
        },
      });
    });
  });

  describe('updatePrice', () => {
    it('should forbid non-owner role from updating product price', async () => {
      await expect(
        service.updatePrice('prod-1', '25000', cashierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update price and log audit', async () => {
      mockDb.db.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi
              .fn()
              .mockResolvedValueOnce([
                { id: 'prod-1', price: '20000.00', name: 'Kopi Susu' },
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
                { id: 'prod-1', price: '25000.00', name: 'Kopi Susu' },
              ]),
          }),
        }),
      });

      const result = await service.updatePrice('prod-1', '25000', ownerUser);
      expect(result.price).toBe('25000.00');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRODUCT_PRICE_UPDATED',
          entityType: 'PRODUCT',
          entityId: 'prod-1',
        }),
      );
    });
  });

  describe('remove historical transactions archive check', () => {
    it('should archive instead of hard delete when product has historical sales', async () => {
      // Mock select product
      // Mock count transactionItems > 0
      // Mock update to archived
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              for: vi
                .fn()
                .mockResolvedValueOnce([
                  { id: 'prod-sold', name: 'Kopi Legend', isActive: true },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce([{ count: 5 }]),
          }),
        });

      mockDb.db.update = vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi
              .fn()
              .mockResolvedValueOnce([
                {
                  id: 'prod-sold',
                  isActive: false,
                  isAvailable: false,
                  status: 'archived',
                },
              ]),
          }),
        }),
      });

      const result = await service.remove('prod-sold', ownerUser);
      expect(result.status).toBe('archived');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRODUCT_DEACTIVATED',
          entityId: 'prod-sold',
        }),
      );
    });
  });

  describe('importProducts', () => {
    it('should import valid rows and return report of failed rows', async () => {
      // Mock select categories
      // Mock select brands
      // Mock select existing products
      mockDb.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi
            .fn()
            .mockResolvedValueOnce([
              { id: 'cat-uuid-1', name: 'Minuman', isActive: true },
            ]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValueOnce([]), // brands
        })
        .mockReturnValueOnce({
          from: vi
            .fn()
            .mockResolvedValueOnce([
              {
                id: 'p1',
                name: 'Existing Tea',
                sku: 'SKU-EXIST',
                barcode: null,
              },
            ]),
        });

      mockDb.db.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ id: 'p-new-1', name: 'Kopi Baru' }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        }),
      });

      const csv = `name,price,category,sku\nKopi Baru,15000,Minuman,SKU-NEW\nInvalid Item,abc,Minuman,SKU-X\nCategory Missing,10000,NonExistent,SKU-Y`;
      const result = await service.importProducts(csv, ownerUser);

      expect(result.totalRows).toBe(3);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.failedRows[0].error).toContain('Invalid price');
      expect(result.failedRows[1].error).toContain(
        "Category 'NonExistent' not found",
      );
    });
  });
});
