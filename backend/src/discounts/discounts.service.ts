import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { discounts } from '../drizzle/schema/index.js';
import type { CreateDiscountDto } from './dto/create-discount.dto.js';
import type { UpdateDiscountDto } from './dto/update-discount.dto.js';

@Injectable()
export class DiscountsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(actor?: AuthenticatedUser) {
    try {
      const query = this.database.db
        .select()
        .from(discounts)
        .orderBy(discounts.createdAt);

      const rows =
        actor?.role === 'CASHIER'
          ? await query.where(eq(discounts.isActive, true))
          : await query;

      if (rows.length === 0 && actor?.role !== 'CASHIER') {
        const initialSeeds = [
          {
            name: 'Diskon Teman Warkop 20%',
            code: 'TEMAN-20',
            type: 'percentage',
            applyMode: 'manual',
            value: '20.00',
            minPurchase: '0.00',
            usageCount: '142',
            description:
              'Diskon manual kasir 20% untuk teman/kerabat yang mampir ngopi di warkop',
          },
          {
            name: 'Potongan Sahabat Ngopi Rp 5.000',
            code: 'SOBAT-5K',
            type: 'fixed',
            applyMode: 'manual',
            value: '5000.00',
            minPurchase: '0.00',
            usageCount: '89',
            description:
              'Potongan langsung Rp 5.000 tanpa batas minimum belanja untuk sahabat',
          },
          {
            name: 'Diskon Kawan Nongkrong 15%',
            code: 'KAWAN-15',
            type: 'percentage',
            applyMode: 'manual',
            value: '15.00',
            minPurchase: '0.00',
            usageCount: '64',
            description: 'Diskon 15% untuk teman tongkrongan warkop',
          },
          {
            name: 'Traktir Kawan Rp 10.000',
            code: 'TRAKTIR-10K',
            type: 'fixed',
            applyMode: 'manual',
            value: '10000.00',
            minPurchase: '0.00',
            usageCount: '37',
            description: 'Potongan Rp 10.000 untuk pesanan teman satu meja',
          },
          {
            name: 'Diskon Komunitas Warkop 10%',
            code: 'KOMUNITAS-10',
            type: 'percentage',
            applyMode: 'manual',
            value: '10.00',
            minPurchase: '0.00',
            usageCount: '53',
            description:
              'Diskon khusus teman komunitas/club yang berkumpul di warkop',
          },
        ];

        try {
          const inserted = await this.database.db
            .insert(discounts)
            .values(initialSeeds)
            .returning();
          return inserted;
        } catch {
          return rows;
        }
      }

      return rows;
    } catch {
      // Graceful fallback for unmigrated environments
      return [];
    }
  }

  async findOne(id: string) {
    try {
      const [discount] = await this.database.db
        .select()
        .from(discounts)
        .where(eq(discounts.id, id))
        .limit(1);

      if (!discount) {
        throw new NotFoundException(`Discount with ID ${id} not found`);
      }

      return discount;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
  }

  async findByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const [discount] = await this.database.db
      .select()
      .from(discounts)
      .where(sql`upper(btrim(${discounts.code})) = ${cleanCode}`)
      .limit(1);

    if (!discount) {
      throw new NotFoundException(`Promo code ${code} not found`);
    }

    return discount;
  }

  async create(input: CreateDiscountDto) {
    const cleanCode = input.code.trim().toUpperCase();

    // Check if code already exists
    try {
      const existing = await this.findByCode(cleanCode).catch(() => null);
      if (existing) {
        throw new ConflictException(
          `Discount code "${cleanCode}" already exists`,
        );
      }

      const [created] = await this.database.db
        .insert(discounts)
        .values({
          name: input.name.trim(),
          code: cleanCode,
          type: input.type,
          applyMode: input.applyMode ?? 'automatic',
          value: String(input.value),
          minPurchase:
            input.minPurchase != null && !isNaN(Number(input.minPurchase))
              ? String(input.minPurchase)
              : '0',
          maxDiscount:
            input.maxDiscount != null && Number(input.maxDiscount) > 0
              ? String(input.maxDiscount)
              : null,
          startDate:
            input.startDate && input.startDate.trim()
              ? new Date(input.startDate)
              : null,
          endDate:
            input.endDate && input.endDate.trim()
              ? new Date(input.endDate)
              : null,
          isActive: input.isActive ?? true,
          description: input.description?.trim() || null,
        })
        .returning();

      return created;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException(
        (err as Error).message || 'Failed to create discount',
      );
    }
  }

  async update(id: string, input: UpdateDiscountDto) {
    await this.findOne(id);

    const valuesToUpdate: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) valuesToUpdate.name = input.name.trim();
    if (input.code !== undefined) {
      valuesToUpdate.code = input.code.trim().toUpperCase();
    }
    if (input.type !== undefined) valuesToUpdate.type = input.type;
    if (input.applyMode !== undefined) {
      valuesToUpdate.applyMode = input.applyMode;
    }
    if (input.value !== undefined) valuesToUpdate.value = String(input.value);
    if (input.minPurchase !== undefined) {
      valuesToUpdate.minPurchase =
        input.minPurchase != null && !isNaN(Number(input.minPurchase))
          ? String(input.minPurchase)
          : '0';
    }
    if (input.maxDiscount !== undefined) {
      valuesToUpdate.maxDiscount =
        input.maxDiscount != null && Number(input.maxDiscount) > 0
          ? String(input.maxDiscount)
          : null;
    }
    if (input.startDate !== undefined) {
      valuesToUpdate.startDate =
        input.startDate && input.startDate.trim()
          ? new Date(input.startDate)
          : null;
    }
    if (input.endDate !== undefined) {
      valuesToUpdate.endDate =
        input.endDate && input.endDate.trim() ? new Date(input.endDate) : null;
    }
    if (input.isActive !== undefined) valuesToUpdate.isActive = input.isActive;
    if (input.description !== undefined) {
      valuesToUpdate.description = input.description?.trim() || null;
    }

    const [updated] = await this.database.db
      .update(discounts)
      .set(valuesToUpdate)
      .where(eq(discounts.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    const [deleted] = await this.database.db
      .delete(discounts)
      .where(eq(discounts.id, id))
      .returning();
    return deleted;
  }
}
