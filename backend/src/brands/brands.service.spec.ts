import { describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('BrandsService', () => {
  const cashier: AuthenticatedUser = {
    id: 'cashier-1',
    role: 'CASHIER',
    sessionId: 's-1',
  };

  const admin: AuthenticatedUser = {
    id: 'admin-1',
    role: 'ADMIN',
    sessionId: 's-2',
  };

  it('findAll: returns only active brands for Cashier, all brands for Admin', async () => {
    const activeBrand = { id: 'b-1', name: 'Nike', isActive: true };
    const inactiveBrand = { id: 'b-2', name: 'Adidas', isActive: false };

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockImplementation((predicate) => ({
            orderBy: vi
              .fn()
              .mockResolvedValue(
                predicate ? [activeBrand] : [activeBrand, inactiveBrand],
              ),
          })),
        })),
      })),
    };

    const service = new BrandsService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    const cashierList = await service.findAll(cashier);
    expect(cashierList).toEqual([activeBrand]);

    const adminList = await service.findAll(admin);
    expect(adminList).toEqual([activeBrand, inactiveBrand]);
  });

  it('findOne: throws NotFoundException when brand not found or inactive for Cashier', async () => {
    const inactiveBrand = { id: 'b-2', name: 'Adidas', isActive: false };

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([inactiveBrand]),
          })),
        })),
      })),
    };

    const service = new BrandsService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    await expect(service.findOne('b-2', cashier)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const foundForAdmin = await service.findOne('b-2', admin);
    expect(foundForAdmin).toEqual(inactiveBrand);
  });

  it('create: creates a new brand and records audit log', async () => {
    const createdBrand = { id: 'b-3', name: 'Puma', isActive: true };
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([createdBrand]),
        })),
      })),
    };

    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new BrandsService(
      { db: { transaction: (cb: any) => cb(tx) } } as never,
      auditLogs as never,
    );

    const result = await service.create({ name: 'Puma' }, admin);
    expect(result).toEqual(createdBrand);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BRAND_CREATED',
        entityType: 'BRAND',
        entityId: 'b-3',
        userId: 'admin-1',
      }),
      expect.anything(),
    );
  });

  it('deactivate: prevents deactivation when active products are associated', async () => {
    const brand = { id: 'b-1', name: 'Nike', isActive: true };
    const activeProduct = { id: 'p-1' };

    const tx = {
      select: vi
        .fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [brand],
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [activeProduct],
            }),
          }),
        })),
    };

    const service = new BrandsService({
      db: { transaction: (cb: any) => cb(tx) },
    } as never);

    await expect(service.deactivate('b-1', admin)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('deactivate: successfully deactivates brand without active products and records audit log', async () => {
    const brand = { id: 'b-1', name: 'Nike', isActive: true };
    const deactivatedBrand = { id: 'b-1', name: 'Nike', isActive: false };

    const tx = {
      select: vi
        .fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [brand],
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: async () => [deactivatedBrand],
          })),
        })),
      })),
    };

    const auditLogs = { record: vi.fn().mockResolvedValue([]) };
    const service = new BrandsService(
      { db: { transaction: (cb: any) => cb(tx) } } as never,
      auditLogs as never,
    );

    const result = await service.deactivate('b-1', admin);
    expect(result.isActive).toBe(false);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BRAND_DEACTIVATED',
        entityType: 'BRAND',
        entityId: 'b-1',
      }),
      expect.anything(),
    );
  });
});
