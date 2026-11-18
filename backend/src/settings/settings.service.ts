import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { storeSettings } from '../drizzle/schema/store-settings.schema.js';
import { devices } from '../drizzle/schema/devices.schema.js';
import { queueCounters } from '../drizzle/schema/queue-counters.schema.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { getWibBusinessDate } from '../common/utils/formatters.js';
import { TaxMode, UpdateSettingsDto } from './dto/update-settings.dto.js';
import { CreateDeviceDto } from './dto/create-device.dto.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';
import { ResetQueueCounterDto } from './dto/reset-queue-counter.dto.js';

export interface StoreSettingsResponse {
  storeName: string;
  storeAddress: string;
  receiptFooter: string;
  taxMode: TaxMode;
  taxRate: number;
  defaultMinStock: number;
  updatedAt?: Date;
  updatedBy?: string | null;
  updatedSeq?: number;
}

function parseJsonbValue<T>(val: unknown, fallback: T): T {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed !== undefined && parsed !== null ? (parsed as T) : fallback;
    } catch {
      return (val as unknown as T) || fallback;
    }
  }
  return val as T;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  private async executeTx<T>(
    fn: (
      tx: Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0],
    ) => Promise<T>,
  ): Promise<T> {
    if (
      this.database.db &&
      typeof (this.database.db as any).transaction === 'function'
    ) {
      return (this.database.db as any).transaction(fn);
    }
    return fn(this.database.db as never);
  }

  /**
   * Retrieve current store settings.
   * Accessible by all authenticated roles (Owner, Admin, Cashier) per REQ-F-SET-003.
   */
  async getSettings(): Promise<StoreSettingsResponse> {
    return this.executeTx(async (tx) => {
      const rows = await tx.select().from(storeSettings);

      const map = new Map<
        string,
        {
          value: unknown;
          updatedAt: Date;
          updatedBy: string | null;
          updatedSeq: number;
        }
      >();
      let latestUpdatedAt: Date | undefined;
      let latestUpdatedBy: string | null = null;
      let maxUpdatedSeq = 0;

      for (const row of rows) {
        map.set(row.key, {
          value: row.value,
          updatedAt: row.updatedAt,
          updatedBy: row.updatedBy,
          updatedSeq: row.updatedSeq,
        });
        if (!latestUpdatedAt || row.updatedAt > latestUpdatedAt) {
          latestUpdatedAt = row.updatedAt;
          latestUpdatedBy = row.updatedBy;
        }
        if (row.updatedSeq > maxUpdatedSeq) {
          maxUpdatedSeq = row.updatedSeq;
        }
      }

      return {
        storeName: parseJsonbValue(map.get('store_name')?.value, 'District 13'),
        storeAddress: parseJsonbValue(map.get('store_address')?.value, ''),
        receiptFooter: parseJsonbValue(map.get('receipt_footer')?.value, ''),
        taxMode: parseJsonbValue(map.get('tax_mode')?.value, TaxMode.NONE),
        taxRate: Number(parseJsonbValue(map.get('tax_rate')?.value, 0)),
        defaultMinStock: Number(
          parseJsonbValue(map.get('default_min_stock')?.value, 0),
        ),
        updatedAt: latestUpdatedAt,
        updatedBy: latestUpdatedBy,
        updatedSeq: maxUpdatedSeq,
      };
    });
  }

  /**
   * Update store settings.
   * Only Owner is allowed to modify store settings (REQ-F-SET-003, Issue #44).
   * Records audit log with before/after values.
   */
  async updateSettings(
    actor: AuthenticatedUser,
    input: UpdateSettingsDto,
  ): Promise<StoreSettingsResponse> {
    if (actor.role.toUpperCase() !== 'OWNER') {
      throw new ForbiddenException(
        'Only owner can modify store settings (REQ-F-SET-003)',
      );
    }

    const updates: Record<string, unknown> = {};
    const storeName = input.storeName ?? input.store_name;
    if (storeName !== undefined) updates['store_name'] = storeName;

    const storeAddress = input.storeAddress ?? input.store_address;
    if (storeAddress !== undefined) updates['store_address'] = storeAddress;

    const receiptFooter = input.receiptFooter ?? input.receipt_footer;
    if (receiptFooter !== undefined) updates['receipt_footer'] = receiptFooter;

    const taxMode = input.taxMode ?? input.tax_mode;
    if (taxMode !== undefined) updates['tax_mode'] = taxMode;

    const taxRate = input.taxRate ?? input.tax_rate;
    if (taxRate !== undefined) updates['tax_rate'] = Number(taxRate);

    const defaultMinStock = input.defaultMinStock ?? input.default_min_stock;
    if (defaultMinStock !== undefined)
      updates['default_min_stock'] = Number(defaultMinStock);

    if (Object.keys(updates).length === 0) {
      return this.getSettings();
    }

    return this.executeTx(async (tx) => {
      const before = await this.getSettings();

      for (const [key, val] of Object.entries(updates)) {
        await tx
          .insert(storeSettings)
          .values({
            key,
            value: val as any,
            updatedBy: actor.id,
            updatedAt: new Date(),
            updatedSeq: 1,
          })
          .onConflictDoUpdate({
            target: storeSettings.key,
            set: {
              value: val as any,
              updatedBy: actor.id,
              updatedAt: new Date(),
            },
          });
      }

      const after = await this.getSettings();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'STORE_SETTING_UPDATED',
            entityType: 'STORE_SETTING',
            entityId: 'settings',
            description: 'Store settings updated by owner',
            metadata: {
              before,
              after,
              changedKeys: Object.keys(updates),
            },
          },
          tx as never,
        );
      }

      return after;
    });
  }

  /**
   * List all registered devices.
   */
  async listDevices() {
    return this.executeTx(async (tx) => {
      return tx.select().from(devices).orderBy(asc(devices.code));
    });
  }

  /**
   * Get device by id.
   */
  async getDevice(id: string) {
    return this.executeTx(async (tx) => {
      const [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, id))
        .limit(1);

      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }
      return device;
    });
  }

  /**
   * Register a new POS / tablet device.
   */
  async createDevice(actor: AuthenticatedUser, dto: CreateDeviceDto) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();

    return this.executeTx(async (tx) => {
      const [existing] = await tx
        .select({ id: devices.id })
        .from(devices)
        .where(eq(devices.code, code))
        .limit(1);

      if (existing) {
        throw new ConflictException(
          `Device with code '${code}' already exists`,
        );
      }

      const [created] = await tx
        .insert(devices)
        .values({
          code,
          name,
          isActive: dto.isActive ?? true,
        })
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'DEVICE_CREATED',
            entityType: 'DEVICE',
            entityId: created.id,
            description: `Device ${created.code} (${created.name}) created`,
            metadata: {
              after: created,
            },
          },
          tx as never,
        );
      }

      return created;
    });
  }

  /**
   * Update device information or status.
   */
  async updateDevice(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateDeviceDto,
  ) {
    return this.executeTx(async (tx) => {
      const [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, id))
        .limit(1);

      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      const changes: Partial<typeof devices.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.name !== undefined) {
        changes.name = dto.name.trim();
      }

      if (dto.code !== undefined) {
        const newCode = dto.code.trim().toUpperCase();
        if (newCode !== device.code) {
          const [duplicate] = await tx
            .select({ id: devices.id })
            .from(devices)
            .where(eq(devices.code, newCode))
            .limit(1);
          if (duplicate) {
            throw new ConflictException(
              `Device with code '${newCode}' already exists`,
            );
          }
          changes.code = newCode;
        }
      }

      if (dto.isActive !== undefined) {
        changes.isActive = dto.isActive;
      }

      const [updated] = await tx
        .update(devices)
        .set(changes)
        .where(eq(devices.id, id))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        const action =
          dto.isActive === false ? 'DEVICE_DEACTIVATED' : 'DEVICE_UPDATED';
        await this.auditLogs.record(
          {
            userId: actor.id,
            action,
            entityType: 'DEVICE',
            entityId: updated.id,
            description: `Device ${updated.code} updated`,
            metadata: {
              before: device,
              after: updated,
            },
          },
          tx as never,
        );
      }

      return updated;
    });
  }

  /**
   * Reset queue counter(s).
   * Only Owner can reset queue counter (REQ-F-SET-004, Issue #44).
   * Increments queue_epoch and resets last_no to 0 for current WIB business date.
   */
  async resetQueueCounter(actor: AuthenticatedUser, dto: ResetQueueCounterDto) {
    if (actor.role.toUpperCase() !== 'OWNER') {
      throw new ForbiddenException(
        'Only owner can reset queue counter (REQ-F-SET-004)',
      );
    }

    const businessDate = getWibBusinessDate();

    return this.executeTx(async (tx) => {
      if (dto.deviceId) {
        const [device] = await tx
          .select()
          .from(devices)
          .where(eq(devices.id, dto.deviceId))
          .limit(1);

        if (!device) {
          throw new NotFoundException(
            `Device with ID ${dto.deviceId} not found`,
          );
        }

        const [counter] = await tx
          .insert(queueCounters)
          .values({
            deviceId: dto.deviceId,
            businessDate,
            lastNo: 0,
            queueEpoch: 1,
          })
          .onConflictDoUpdate({
            target: [queueCounters.deviceId, queueCounters.businessDate],
            set: {
              lastNo: 0,
              queueEpoch: sql`${queueCounters.queueEpoch} + 1`,
            },
          })
          .returning();

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          await this.auditLogs.record(
            {
              userId: actor.id,
              action: 'QUEUE_COUNTER_RESET',
              entityType: 'QUEUE_COUNTER',
              entityId: `${dto.deviceId}_${businessDate}`,
              description: `Queue counter reset for device ${device.code} on ${businessDate}`,
              metadata: {
                deviceId: dto.deviceId,
                deviceCode: device.code,
                businessDate,
                queueEpoch: counter.queueEpoch,
                after: counter,
              },
            },
            tx as never,
          );
        }

        return {
          success: true,
          message: `Queue counter reset for device ${device.code}`,
          businessDate,
          deviceId: dto.deviceId,
          deviceCode: device.code,
          queueEpoch: counter.queueEpoch,
          lastNo: counter.lastNo,
        };
      }

      // Reset for all active devices
      const activeDevices = await tx
        .select()
        .from(devices)
        .where(eq(devices.isActive, true));

      const results = [];
      for (const device of activeDevices) {
        const [counter] = await tx
          .insert(queueCounters)
          .values({
            deviceId: device.id,
            businessDate,
            lastNo: 0,
            queueEpoch: 1,
          })
          .onConflictDoUpdate({
            target: [queueCounters.deviceId, queueCounters.businessDate],
            set: {
              lastNo: 0,
              queueEpoch: sql`${queueCounters.queueEpoch} + 1`,
            },
          })
          .returning();
        results.push({ deviceCode: device.code, counter });
      }

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'QUEUE_COUNTER_RESET',
            entityType: 'QUEUE_COUNTER',
            entityId: `all_${businessDate}`,
            description: `Queue counters reset for all devices on ${businessDate}`,
            metadata: {
              businessDate,
              devicesCount: activeDevices.length,
            },
          },
          tx as never,
        );
      }

      return {
        success: true,
        message: 'Queue counters reset for all active devices',
        businessDate,
        resetDevicesCount: activeDevices.length,
      };
    });
  }

  /**
   * Helper to allocate the next queue number atomically for a device.
   * Queue number format: `${deviceCode}-${String(last_no).padStart(3, '0')}` (e.g. 'T1-007').
   * Resets automatically per day since businessDate is part of composite primary key.
   */
  async getNextQueueNumber(deviceId: string, dateInput?: Date | string) {
    const businessDate = getWibBusinessDate(dateInput);

    return this.executeTx(async (tx) => {
      const [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, deviceId))
        .limit(1);

      if (!device) {
        throw new NotFoundException(`Device with ID ${deviceId} not found`);
      }
      if (!device.isActive) {
        throw new BadRequestException(`Device ${device.code} is inactive`);
      }

      const [counter] = await tx
        .insert(queueCounters)
        .values({
          deviceId,
          businessDate,
          lastNo: 1,
          queueEpoch: 0,
        })
        .onConflictDoUpdate({
          target: [queueCounters.deviceId, queueCounters.businessDate],
          set: {
            lastNo: sql`${queueCounters.lastNo} + 1`,
          },
        })
        .returning();

      const queueNo = `${device.code}-${String(counter.lastNo).padStart(3, '0')}`;

      return {
        queueNo,
        lastNo: counter.lastNo,
        queueEpoch: counter.queueEpoch,
        businessDate,
        deviceId,
        deviceCode: device.code,
      };
    });
  }

  /**
   * Get device counters for client sync / counter recovery.
   */
  async getDeviceCounters(deviceId: string, dateInput?: Date | string) {
    const businessDate = getWibBusinessDate(dateInput);

    return this.executeTx(async (tx) => {
      const [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, deviceId))
        .limit(1);

      if (!device) {
        throw new NotFoundException(`Device with ID ${deviceId} not found`);
      }

      const [counter] = await tx
        .select()
        .from(queueCounters)
        .where(
          and(
            eq(queueCounters.deviceId, deviceId),
            eq(queueCounters.businessDate, businessDate),
          ),
        )
        .limit(1);

      return {
        deviceId,
        deviceCode: device.code,
        businessDate,
        lastNo: counter?.lastNo ?? 0,
        queueEpoch: counter?.queueEpoch ?? 0,
      };
    });
  }
}
