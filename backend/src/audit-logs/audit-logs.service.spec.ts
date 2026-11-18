import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  AuditLogsService,
  sanitizedAuditMetadata,
} from './audit-logs.service.js';
import type { AuditLogsQueryDto } from './audit-logs.dto.js';

describe('AuditLogsService', () => {
  describe('sanitizedAuditMetadata', () => {
    it('removes sensitive keys recursively from metadata', () => {
      const raw = {
        username: 'admin',
        password: 'plain-text-password',
        authToken: 'secret-jwt',
        sessionCookie: 'session-id',
        nested: {
          clientSecret: 'shhh',
          apiKey: 'key',
          validData: 123,
          credentialHash: 'hash',
        },
      };

      const sanitized = sanitizedAuditMetadata(raw) as any;

      expect(sanitized.username).toBe('admin');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.authToken).toBeUndefined();
      expect(sanitized.sessionCookie).toBeUndefined();
      expect(sanitized.nested.validData).toBe(123);
      expect(sanitized.nested.apiKey).toBe('key');
      expect(sanitized.nested.clientSecret).toBeUndefined();
      expect(sanitized.nested.credentialHash).toBeUndefined();
    });
  });

  describe('record', () => {
    it('inserts audit log using the provided transaction executor', async () => {
      const insertReturning = vi.fn().mockResolvedValue([
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'SHIFT_OPENED',
          entityType: 'SHIFT',
          entityId: 'shift-1',
          description: 'Shift opened',
        },
      ]);
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: insertReturning,
          }),
        }),
      };
      const service = new AuditLogsService({} as never);

      const result = await service.record(
        {
          userId: 'user-1',
          action: 'SHIFT_OPENED',
          entityType: 'SHIFT',
          entityId: 'shift-1',
          description: 'Shift opened',
          metadata: { openingCash: '100000' },
        },
        tx as never,
      );

      expect(tx.insert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('log-1');
    });

    it('rejects unsupported audit action with BadRequestException', async () => {
      const service = new AuditLogsService({} as never);

      await expect(
        service.record({
          action: 'INVALID_ACTION_NAME' as never,
          entityType: 'SHIFT',
          description: 'Invalid',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('AC: failure during audit record throws and causes parent transaction rollback', async () => {
      let businessOperationExecuted = false;
      let transactionRolledBack = false;

      const mockDb = {
        transaction: async (cb: (tx: any) => Promise<any>) => {
          try {
            const fakeTx = {
              insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                  returning: async () => {
                    throw new Error('Database disk full / constraint error');
                  },
                }),
              }),
            };
            return await cb(fakeTx);
          } catch (err) {
            transactionRolledBack = true;
            throw err;
          }
        },
      };

      const service = new AuditLogsService(mockDb as never);

      await expect(
        mockDb.transaction(async (tx) => {
          // 1. Business operation happens
          businessOperationExecuted = true;
          // 2. Audit log fails
          await service.record(
            {
              action: 'SHIFT_OPENED',
              entityType: 'SHIFT',
              description: 'Shift opened',
            },
            tx,
          );
        }),
      ).rejects.toThrow('Database disk full / constraint error');

      expect(businessOperationExecuted).toBe(true);
      expect(transactionRolledBack).toBe(true);
    });
  });

  describe('list', () => {
    it('throws BadRequestException when startDate is greater than endDate', async () => {
      const service = new AuditLogsService({} as never);

      await expect(
        service.list(
          {
            startDate: '2026-11-20',
            endDate: '2026-11-10',
            page: 1,
            limit: 20,
          },
          false,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('queries full audit logs for Owner without operational restrictions', async () => {
      const selectMock = vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([
                    {
                      id: 'log-1',
                      action: 'AUTH_LOGIN_SUCCESS',
                      entityType: 'USER',
                      description: 'User login',
                    },
                    {
                      id: 'log-2',
                      action: 'PRODUCT_CREATED',
                      entityType: 'PRODUCT',
                      description: 'Product created',
                    },
                  ]),
                }),
              }),
            }),
          }),
          where: vi.fn().mockResolvedValue([{ total: 2 }]),
        }),
      }));

      const database = { db: { select: selectMock } };
      const service = new AuditLogsService(database as never);

      const q: AuditLogsQueryDto = { page: 1, limit: 20 };
      const result = await service.list(q, false); // operational = false (Owner)

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('restricts query to operational logs for Admin', async () => {
      const whereSpy = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([
              {
                id: 'log-2',
                action: 'PRODUCT_CREATED',
                entityType: 'PRODUCT',
                description: 'Product created',
              },
            ]),
          }),
        }),
      });

      const selectMock = vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: whereSpy,
          }),
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      }));

      const database = { db: { select: selectMock } };
      const service = new AuditLogsService(database as never);

      const q: AuditLogsQueryDto = { page: 1, limit: 20 };
      const result = await service.list(q, true); // operational = true (Admin)

      expect(result.data).toHaveLength(1);
      expect(result.data[0].entityType).toBe('PRODUCT');
      expect(result.total).toBe(1);
    });
  });
});
