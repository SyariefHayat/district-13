import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { addons, productAddons } from '../drizzle/schema/index.js';
import type { CreateAddonDto } from './dto/create-addon.dto.js';
import type { UpdateAddonDto } from './dto/update-addon.dto.js';

@Injectable()
export class AddonsService {
  constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  findAll(actor: AuthenticatedUser) {
    return this.database.db
      .select({
        id: addons.id,
        name: addons.name,
        price: addons.price,
        isActive: addons.isActive,
        linkedProductsCount: sql<number>`count(${productAddons.productId})::int`,
      })
      .from(addons)
      .leftJoin(productAddons, eq(addons.id, productAddons.addonId))
      .where(actor.role === 'CASHIER' ? eq(addons.isActive, true) : undefined)
      .groupBy(addons.id)
      .orderBy(addons.name);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const [addon] = await this.database.db
      .select()
      .from(addons)
      .where(eq(addons.id, id))
      .limit(1);
    if (!addon || (actor.role === 'CASHIER' && !addon.isActive)) {
      throw new NotFoundException('Add-on not found');
    }
    return addon;
  }

  async create(input: CreateAddonDto, actor?: AuthenticatedUser) {
    const [addon] = await this.database.db
      .insert(addons)
      .values({
        name: input.name.trim(),
        price: normalizePrice(input.price),
        isActive: input.isActive ?? true,
      })
      .returning();

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor?.id,
        action: 'ADDON_CREATED',
        entityType: 'ADDON',
        entityId: addon.id,
        description: `Addon ${addon.name} created`,
        metadata: { after: addon },
      });
    }

    return addon;
  }

  async updatePrice(id: string, price: string, actor: AuthenticatedUser) {
    if (!roleHasPermission(actor.role, PERMISSIONS.addonsUpdatePrices)) {
      throw new ForbiddenException('Only the owner can change add-on prices');
    }
    const existing = await this.findOne(id, actor);
    const newPrice = normalizePrice(price);
    const [updated] = await this.database.db
      .update(addons)
      .set({ price: newPrice })
      .where(eq(addons.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Add-on not found');

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor.id,
        action: 'ADDON_UPDATED',
        entityType: 'ADDON',
        entityId: id,
        description: `Addon ${existing.name} price updated from ${existing.price} to ${updated.price}`,
        metadata: {
          before: { price: existing.price },
          after: { price: updated.price },
        },
      });
    }

    return updated;
  }

  async update(id: string, input: UpdateAddonDto, actor: AuthenticatedUser) {
    if (
      input.price !== undefined &&
      !roleHasPermission(actor.role, PERMISSIONS.addonsUpdatePrices)
    ) {
      throw new ForbiddenException('Only the owner can change add-on prices');
    }
    if (
      (input.name !== undefined || input.isActive !== undefined) &&
      !roleHasPermission(actor.role, PERMISSIONS.addonsManage)
    ) {
      throw new ForbiddenException('You cannot manage add-ons');
    }
    const existing = await this.findOne(id, actor);

    const changes: Partial<typeof addons.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name.trim();
    if (input.price !== undefined) changes.price = normalizePrice(input.price);
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (!Object.keys(changes).length)
      throw new BadRequestException('At least one field must be provided');
    const [addon] = await this.database.db
      .update(addons)
      .set(changes)
      .where(eq(addons.id, id))
      .returning();
    if (!addon) throw new NotFoundException('Add-on not found');

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor.id,
        action: 'ADDON_UPDATED',
        entityType: 'ADDON',
        entityId: id,
        description: `Addon ${addon.name} updated`,
        metadata: {
          before: existing,
          after: addon,
        },
      });
    }

    return addon;
  }

  async remove(id: string, actor?: AuthenticatedUser) {
    const existing = await this.database.db
      .select()
      .from(addons)
      .where(eq(addons.id, id))
      .limit(1)
      .then((rows) => rows[0]);
    if (!existing) throw new NotFoundException('Add-on not found');

    return this.database.db.transaction(async (tx) => {
      await tx.delete(productAddons).where(eq(productAddons.addonId, id));
      const [deleted] = await tx
        .delete(addons)
        .where(eq(addons.id, id))
        .returning();

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record({
          userId: actor?.id,
          action: 'ADDON_DEACTIVATED',
          entityType: 'ADDON',
          entityId: id,
          description: `Addon ${existing.name} removed`,
          metadata: { before: existing },
        });
      }

      return deleted;
    });
  }

  async deactivate(id: string, actor?: AuthenticatedUser) {
    const [addon] = await this.database.db
      .update(addons)
      .set({ isActive: false })
      .where(eq(addons.id, id))
      .returning();
    if (!addon) throw new NotFoundException('Add-on not found');

    if (this.auditLogs && typeof this.auditLogs.record === 'function') {
      await this.auditLogs.record({
        userId: actor?.id,
        action: 'ADDON_DEACTIVATED',
        entityType: 'ADDON',
        entityId: id,
        description: `Addon ${addon.name} deactivated`,
        metadata: { after: { isActive: false } },
      });
    }

    return addon;
  }
}

function normalizePrice(price: string): string {
  const [whole, fractional = ''] = price.split('.');
  return `${whole}.${fractional.padEnd(2, '0')}`;
}
