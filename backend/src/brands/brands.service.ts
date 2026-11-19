import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { brands } from '../drizzle/schema/brands.schema.js';
import { products } from '../drizzle/schema/products.schema.js';
import type { CreateBrandDto } from './dto/create-brand.dto.js';
import type { UpdateBrandDto } from './dto/update-brand.dto.js';

@Injectable()
export class BrandsService {
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
   * List brands.
   * Cashiers only receive active brands; Admin and Owner receive all brands.
   */
  async findAll(actor: AuthenticatedUser) {
    return this.executeTx(async (tx) => {
      return tx
        .select()
        .from(brands)
        .where(
          actor.role.toUpperCase() === 'CASHIER'
            ? eq(brands.isActive, true)
            : undefined,
        )
        .orderBy(asc(brands.name));
    });
  }

  /**
   * Get brand by id.
   */
  async findOne(id: string, actor: AuthenticatedUser) {
    return this.executeTx(async (tx) => {
      const [brand] = await tx
        .select()
        .from(brands)
        .where(eq(brands.id, id))
        .limit(1);

      if (
        !brand ||
        (actor.role.toUpperCase() === 'CASHIER' && !brand.isActive)
      ) {
        throw new NotFoundException('Brand not found');
      }
      return brand;
    });
  }

  /**
   * Create brand.
   */
  async create(input: CreateBrandDto, actor?: AuthenticatedUser) {
    const trimmedName = input.name.trim();

    return this.mapDuplicateName(async () => {
      return this.executeTx(async (tx) => {
        const [brand] = await tx
          .insert(brands)
          .values({
            name: trimmedName,
            isActive: input.isActive ?? true,
            updatedSeq: 1,
          })
          .returning();

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          await this.auditLogs.record(
            {
              userId: actor?.id,
              action: 'BRAND_CREATED',
              entityType: 'BRAND',
              entityId: brand.id,
              description: `Brand ${brand.name} created`,
              metadata: { after: brand },
            },
            tx as never,
          );
        }

        return brand;
      });
    });
  }

  /**
   * Update brand.
   */
  async update(id: string, input: UpdateBrandDto, actor?: AuthenticatedUser) {
    const changes: Partial<typeof brands.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name.trim();
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (!Object.keys(changes).length) {
      throw new BadRequestException('At least one field must be provided');
    }

    return this.mapDuplicateName(() =>
      this.executeTx(async (tx) => {
        const [brand] = await tx
          .select()
          .from(brands)
          .where(eq(brands.id, id))
          .limit(1);

        if (!brand) throw new NotFoundException('Brand not found');

        if (input.isActive === false) {
          await this.assertNoActiveProducts(tx, id);
        }

        const [updated] = await tx
          .update(brands)
          .set(changes)
          .where(eq(brands.id, id))
          .returning();

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          const action =
            input.isActive === true && !brand.isActive
              ? 'BRAND_REACTIVATED'
              : input.isActive === false && brand.isActive
                ? 'BRAND_DEACTIVATED'
                : 'BRAND_UPDATED';

          await this.auditLogs.record(
            {
              userId: actor?.id,
              action,
              entityType: 'BRAND',
              entityId: updated.id,
              description: `Brand ${updated.name} updated`,
              metadata: { before: brand, after: updated },
            },
            tx as never,
          );
        }

        return updated;
      }),
    );
  }

  /**
   * Soft deactivate brand.
   */
  async deactivate(id: string, actor?: AuthenticatedUser) {
    return this.update(id, { isActive: false }, actor);
  }

  /**
   * Reactivate brand.
   */
  async activate(id: string, actor?: AuthenticatedUser) {
    return this.update(id, { isActive: true }, actor);
  }

  private async assertNoActiveProducts(
    tx: Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0],
    brandId: string,
  ) {
    const [activeProduct] = await tx
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.brandId, brandId), eq(products.isActive, true)))
      .limit(1);

    if (activeProduct) {
      throw new ConflictException(
        'Deactivate or move active products before deactivating this brand',
      );
    }
  }

  private async mapDuplicateName<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Brand name already exists');
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  const visited = new Set<object>();
  let current = error;
  while (typeof current === 'object' && current !== null) {
    if (visited.has(current)) return false;
    visited.add(current);
    if ('code' in current && current.code === '23505') return true;
    current = 'cause' in current ? current.cause : undefined;
  }
  return false;
}
