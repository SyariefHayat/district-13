import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
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

  async create(input: CreateAddonDto) {
    const [addon] = await this.database.db
      .insert(addons)
      .values({
        name: input.name.trim(),
        price: input.price.toFixed(2),
        isActive: input.isActive ?? true,
      })
      .returning();
    return addon;
  }

  async update(id: string, input: UpdateAddonDto) {
    const changes: Partial<typeof addons.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name.trim();
    if (input.price !== undefined) changes.price = input.price.toFixed(2);
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
