import { hash } from 'argon2';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { sessions, users } from '../drizzle/schema/index.js';
import type { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    return this.database.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(users.createdAt);
  }

  async create(input: CreateUserDto) {
    const passwordHash = await hash(input.password);
    try {
      const [user] = await this.database.db
        .insert(users)
        .values({
          username: input.username,
          passwordHash,
          role: input.role,
          isActive: true,
        })
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Username is already in use');
      }
      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean, currentUserId: string) {
    if (!isActive) this.assertNotSelf(id, currentUserId);

    if (!isActive) {
      return this.database.db.transaction(async (tx) => {
        await lockOwnerLifecycle(tx);
        const [user] = await tx
          .select({ id: users.id, role: users.role, isActive: users.isActive })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (!user) throw new NotFoundException('User not found');

        if (user.role === 'OWNER' && user.isActive) {
          await this.assertAnotherActiveOwner(tx);
        }

        const [updated] = await tx
          .update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning({
            id: users.id,
            username: users.username,
            role: users.role,
            isActive: users.isActive,
            updatedAt: users.updatedAt,
          });

        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
        return updated;
      });
    }

    const [updated] = await this.database.db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string, currentUserId: string): Promise<{ success: true }> {
    this.assertNotSelf(id, currentUserId);

    return this.database.db.transaction(async (tx) => {
      await lockOwnerLifecycle(tx);
      const [user] = await tx
        .select({ id: users.id, role: users.role, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!user) throw new NotFoundException('User not found');

      if (user.role === 'OWNER' && user.isActive) {
        await this.assertAnotherActiveOwner(tx);
      }

      await tx.delete(users).where(eq(users.id, id));
      return { success: true };
    });
  }

  private assertNotSelf(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException(
        'You cannot deactivate or delete your own account',
      );
    }
  }

  private async assertAnotherActiveOwner(
    tx: Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0],
  ) {
    const [result] = await tx
      .select({ total: count() })
      .from(users)
      .where(and(eq(users.role, 'OWNER'), eq(users.isActive, true)));
    if (Number(result.total) <= 1) {
      throw new ConflictException(
        'Cannot deactivate or delete the last active owner',
      );
    }
  }
}

async function lockOwnerLifecycle(
  tx: Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0],
) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(29475, 1)`);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
