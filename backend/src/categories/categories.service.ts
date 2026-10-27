import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  categories,
  products,
  subcategories,
} from '../drizzle/schema/index.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { CreateSubcategoryDto } from './dto/create-subcategory.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly database: DatabaseService) {}

  findAll(actor: AuthenticatedUser) {
    return this.database.db
      .select()
      .from(categories)
      .where(
        actor.role === 'CASHIER' ? eq(categories.isActive, true) : undefined,
      )
      .orderBy(categories.name);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const [category] = await this.database.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!category || (actor.role === 'CASHIER' && !category.isActive)) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(input: CreateCategoryDto) {
    return this.mapDuplicateName(async () => {
      const [category] = await this.database.db
        .insert(categories)
        .values({
          name: input.name.trim(),
          isActive: input.isActive ?? true,
        })
        .returning();
      return category;
    });
  }

  async update(id: string, input: UpdateCategoryDto) {
    const changes: Partial<typeof categories.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name.trim();
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (!Object.keys(changes).length)
      throw new BadRequestException('At least one field must be provided');
    return this.mapDuplicateName(() =>
      this.database.db.transaction(async (tx) => {
        const [category] = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, id))
          .for('update');
        if (!category) throw new NotFoundException('Category not found');
        if (input.isActive === false) await this.assertNoActiveProducts(tx, id);
        const [updated] = await tx
          .update(categories)
          .set(changes)
          .where(eq(categories.id, id))
          .returning();
        return updated;
      }),
    );
  }

  async deactivate(id: string) {
    return this.database.db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, id))
        .for('update');
      if (!category) throw new NotFoundException('Category not found');
      await this.assertNoActiveProducts(tx, id);
      const [updated] = await tx
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, id))
        .returning();
      return updated;
    });
  }

  async findSubcategories(categoryId: string, actor: AuthenticatedUser) {
    const [category] = await this.database.db
      .select({ id: categories.id, isActive: categories.isActive })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!category || (actor.role === 'CASHIER' && !category.isActive)) {
      throw new NotFoundException('Category not found');
    }

    return this.database.db
      .select()
      .from(subcategories)
      .where(
        and(
          eq(subcategories.categoryId, categoryId),
          actor.role === 'CASHIER'
            ? eq(subcategories.isActive, true)
            : undefined,
        ),
      )
      .orderBy(subcategories.name);
  }

  async createSubcategory(categoryId: string, input: CreateSubcategoryDto) {
    return this.database.db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id, isActive: categories.isActive })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .for('share');
      if (!category) throw new NotFoundException('Category not found');
      if (!category.isActive) {
        throw new BadRequestException('Category is inactive');
      }

      const trimmedName = input.name.trim();

      const [existing] = await tx
        .select()
        .from(subcategories)
        .where(
          and(
            eq(subcategories.categoryId, categoryId),
            sql`lower(btrim(${subcategories.name})) = lower(btrim(${trimmedName}))`,
          ),
        )
        .for('update');

      if (existing) {
        if (existing.isActive) {
          throw new ConflictException(
            'Subcategory name already exists in this category',
          );
        }
        const [reactivated] = await tx
          .update(subcategories)
          .set({ isActive: true })
          .where(eq(subcategories.id, existing.id))
          .returning();
        return reactivated;
      }

      const [created] = await tx
        .insert(subcategories)
        .values({
          name: trimmedName,
          categoryId,
          isActive: input.isActive ?? true,
        })
        .returning();
      return created;
    });
  }

  async deactivateSubcategory(id: string, categoryId?: string) {
    return this.database.db.transaction(async (tx) => {
      const filters = [eq(subcategories.id, id)];
      if (categoryId) {
        filters.push(eq(subcategories.categoryId, categoryId));
      }
      const [sub] = await tx
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(and(...filters))
        .for('update');
      if (!sub) throw new NotFoundException('Subcategory not found');

      const [activeProduct] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.subCategoryId, id), eq(products.isActive, true)))
        .limit(1);
      if (activeProduct) {
        throw new ConflictException(
          'Deactivate or move active products before deactivating this subcategory',
        );
      }

      const [updated] = await tx
        .update(subcategories)
        .set({ isActive: false })
        .where(eq(subcategories.id, id))
        .returning();
      return updated;
    });
  }

  private async assertNoActiveProducts(
    tx: Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0],
    id: string,
  ) {
    const [activeProduct] = await tx
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.isActive, true)))
      .limit(1);
    if (activeProduct) {
      throw new ConflictException(
        'Deactivate or move active products before deactivating this category',
      );
    }
  }

  private async mapDuplicateName<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Category name already exists');
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
