import { describe, expect, it, vi } from 'vitest';
import { SettingsController } from './settings.controller.js';
import { DevicesController } from './devices.controller.js';
import { TaxMode } from './dto/update-settings.dto.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('SettingsController and DevicesController (T-21)', () => {
  const ownerActor: AuthenticatedUser = {
    id: 'owner-1',
    role: 'OWNER',
    sessionId: 'session-1',
  };

  const mockSettingsService = {
    getSettings: vi.fn().mockResolvedValue({
      storeName: 'District 13',
      storeAddress: 'Jl. Thamrin',
      receiptFooter: 'Terima kasih',
      taxMode: TaxMode.NONE,
      taxRate: 0,
      defaultMinStock: 0,
    }),
    updateSettings: vi.fn().mockResolvedValue({
      storeName: 'District 13 New',
      taxMode: TaxMode.INCLUSIVE,
      taxRate: 11,
    }),
    resetQueueCounter: vi.fn().mockResolvedValue({
      success: true,
      message: 'Queue counter reset successfully',
    }),
    listDevices: vi
      .fn()
      .mockResolvedValue([
        { id: 'dev-1', code: 'POS-01', name: 'Kasir 1', isActive: true },
      ]),
    getDevice: vi.fn().mockResolvedValue({
      id: 'dev-1',
      code: 'POS-01',
      name: 'Kasir 1',
    }),
    createDevice: vi.fn().mockResolvedValue({
      id: 'dev-2',
      code: 'POS-02',
      name: 'Kasir 2',
    }),
    updateDevice: vi.fn().mockResolvedValue({
      id: 'dev-1',
      code: 'POS-01',
      name: 'Kasir 1 Renamed',
    }),
    getDeviceCounters: vi.fn().mockResolvedValue({
      deviceId: 'dev-1',
      deviceCode: 'POS-01',
      lastNo: 5,
      queueEpoch: 0,
    }),
  };

  it('SettingsController: delegates to SettingsService', async () => {
    const controller = new SettingsController(mockSettingsService as never);

    const settings = await controller.getSettings();
    expect(settings.storeName).toBe('District 13');
    expect(mockSettingsService.getSettings).toHaveBeenCalled();

    const updated = await controller.updateSettings(ownerActor, {
      storeName: 'District 13 New',
    });
    expect(updated.storeName).toBe('District 13 New');
    expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
      ownerActor,
      { storeName: 'District 13 New' },
    );

    const reset = await controller.resetQueueCounter(ownerActor, {
      deviceId: 'dev-1',
    });
    expect(reset.success).toBe(true);
    expect(mockSettingsService.resetQueueCounter).toHaveBeenCalledWith(
      ownerActor,
      { deviceId: 'dev-1' },
    );
  });

  it('DevicesController: delegates CRUD to SettingsService', async () => {
    const controller = new DevicesController(mockSettingsService as never);

    const list = await controller.listDevices();
    expect(list).toHaveLength(1);

    const single = await controller.getDevice('dev-1');
    expect(single.code).toBe('POS-01');

    const created = await controller.createDevice(ownerActor, {
      code: 'POS-02',
      name: 'Kasir 2',
    });
    expect(created.code).toBe('POS-02');

    const updated = await controller.updateDevice(ownerActor, 'dev-1', {
      name: 'Kasir 1 Renamed',
    });
    expect(updated.name).toBe('Kasir 1 Renamed');

    const counters = await controller.getDeviceCounters('dev-1');
    expect(counters.lastNo).toBe(5);
  });
});
