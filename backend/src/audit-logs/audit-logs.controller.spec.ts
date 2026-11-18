import { describe, expect, it, vi } from 'vitest';
import { AuditLogsController } from './audit-logs.controller.js';
import type { AuditLogsQueryDto } from './audit-logs.dto.js';

describe('AuditLogsController', () => {
  it('calls list with operational=false when user is OWNER', async () => {
    const listSpy = vi.fn().mockResolvedValue({
      data: [{ id: '1', action: 'USER_CREATED' }],
      page: 1,
      limit: 20,
      total: 1,
    });
    const mockService = { list: listSpy };
    const controller = new AuditLogsController(mockService as never);

    const query: AuditLogsQueryDto = { page: 1, limit: 20 };
    const req = { user: { role: 'OWNER' } } as any;

    const result = await controller.list(query, req);

    expect(listSpy).toHaveBeenCalledWith(query, false);
    expect(result.data).toHaveLength(1);
  });

  it('calls list with operational=false when user is owner (lowercase)', async () => {
    const listSpy = vi.fn().mockResolvedValue({
      data: [{ id: '1', action: 'USER_CREATED' }],
      page: 1,
      limit: 20,
      total: 1,
    });
    const mockService = { list: listSpy };
    const controller = new AuditLogsController(mockService as never);

    const query: AuditLogsQueryDto = { page: 1, limit: 20 };
    const req = { user: { role: 'owner' } } as any;

    await controller.list(query, req);

    expect(listSpy).toHaveBeenCalledWith(query, false);
  });

  it('calls list with operational=true when user is ADMIN', async () => {
    const listSpy = vi.fn().mockResolvedValue({
      data: [{ id: '2', action: 'PRODUCT_CREATED' }],
      page: 1,
      limit: 20,
      total: 1,
    });
    const mockService = { list: listSpy };
    const controller = new AuditLogsController(mockService as never);

    const query: AuditLogsQueryDto = { page: 1, limit: 20 };
    const req = { user: { role: 'ADMIN' } } as any;

    const result = await controller.list(query, req);

    expect(listSpy).toHaveBeenCalledWith(query, true);
    expect(result.data).toHaveLength(1);
  });

  it('calls list with operational=true when user is admin (lowercase)', async () => {
    const listSpy = vi.fn().mockResolvedValue({
      data: [{ id: '2', action: 'PRODUCT_CREATED' }],
      page: 1,
      limit: 20,
      total: 1,
    });
    const mockService = { list: listSpy };
    const controller = new AuditLogsController(mockService as never);

    const query: AuditLogsQueryDto = { page: 1, limit: 20 };
    const req = { user: { role: 'admin' } } as any;

    await controller.list(query, req);

    expect(listSpy).toHaveBeenCalledWith(query, true);
  });
});
