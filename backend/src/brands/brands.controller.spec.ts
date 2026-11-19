import { describe, expect, it, vi } from 'vitest';
import { BrandsController } from './brands.controller.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('BrandsController', () => {
  const actor: AuthenticatedUser = {
    id: 'admin-1',
    role: 'ADMIN',
    sessionId: 's-1',
  };

  const mockService = {
    findAll: vi.fn().mockResolvedValue([{ id: 'b-1', name: 'Nike' }]),
    findOne: vi.fn().mockResolvedValue({ id: 'b-1', name: 'Nike' }),
    create: vi.fn().mockResolvedValue({ id: 'b-1', name: 'Nike' }),
    update: vi.fn().mockResolvedValue({ id: 'b-1', name: 'Nike Updated' }),
    deactivate: vi.fn().mockResolvedValue({ id: 'b-1', isActive: false }),
    activate: vi.fn().mockResolvedValue({ id: 'b-1', isActive: true }),
  };

  const controller = new BrandsController(mockService as never);

  it('delegates CRUD endpoints to BrandsService', async () => {
    await expect(controller.findAll(actor)).resolves.toEqual([
      { id: 'b-1', name: 'Nike' },
    ]);
    expect(mockService.findAll).toHaveBeenCalledWith(actor);

    await expect(controller.findOne('b-1', actor)).resolves.toEqual({
      id: 'b-1',
      name: 'Nike',
    });
    expect(mockService.findOne).toHaveBeenCalledWith('b-1', actor);

    await expect(controller.create({ name: 'Nike' }, actor)).resolves.toEqual({
      id: 'b-1',
      name: 'Nike',
    });
    expect(mockService.create).toHaveBeenCalledWith({ name: 'Nike' }, actor);

    await expect(
      controller.update('b-1', { name: 'Nike Updated' }, actor),
    ).resolves.toEqual({ id: 'b-1', name: 'Nike Updated' });
    expect(mockService.update).toHaveBeenCalledWith(
      'b-1',
      { name: 'Nike Updated' },
      actor,
    );

    await expect(controller.deactivate('b-1', actor)).resolves.toEqual({
      id: 'b-1',
      isActive: false,
    });
    expect(mockService.deactivate).toHaveBeenCalledWith('b-1', actor);

    await expect(controller.activate('b-1', actor)).resolves.toEqual({
      id: 'b-1',
      isActive: true,
    });
    expect(mockService.activate).toHaveBeenCalledWith('b-1', actor);
  });
});
