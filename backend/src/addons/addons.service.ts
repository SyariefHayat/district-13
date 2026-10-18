import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { addons } from '../drizzle/schema/index.js';
import type { CreateAddonDto } from './dto/create-addon.dto.js';
import type { UpdateAddonDto } from './dto/update-addon.dto.js';

@Injectable()
export class AddonsService {
  constructor(private readonly database: DatabaseService) {}

  findAll(actor: AuthenticatedUser) {
    return this.database.db
      .select()
      .from(addons)
      .where(actor.role === 'CASHIER' ? eq(addons.isActive, true) : undefined)
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

  async create(input: CreateAddonDto) {
    const [addon] = await this.database.db
      .insert(addons)
      .values({
        name: input.name.trim(),
        price: normalizePrice(input.price),
        isActive: input.isActive ?? true,
      })
      .returning();
    return addon;
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
    return addon;
  }

  async deactivate(id: string) {
    const [addon] = await this.database.db
      .update(addons)
      .set({ isActive: false })
      .where(eq(addons.id, id))
      .returning();
    if (!addon) throw new NotFoundException('Add-on not found');
    return addon;
  }
}

function normalizePrice(price: string): string {
  const [whole, fractional = ''] = price.split('.');
  return `${whole}.${fractional.padEnd(2, '0')}`;
}
