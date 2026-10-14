import { hash } from 'argon2';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { sessions, users } from '../drizzle/schema/index.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

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

  async update(id: string, actor: AuthenticatedUser, input: UpdateUserDto) {
    const suppliedFields = Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field as keyof UpdateUserDto);
    if (suppliedFields.length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const passwordHash =
      input.password !== undefined ? await hash(input.password) : undefined;

    try {
      return await this.database.db.transaction(async (tx) => {
        const [target] = await tx
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (!target) throw new NotFoundException('User not found');

        const updatePermission = this.getUpdatePermission(actor, target);
        if (!roleHasPermission(actor.role, updatePermission)) {
          throw new ForbiddenException();
        }

        const allowedFields = this.getAllowedUpdateFields(actor, target);
        if (suppliedFields.some((field) => !allowedFields.includes(field))) {
          throw new ForbiddenException(
            'You cannot change one or more supplied fields',
          );
        }

        const changes: Partial<typeof users.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (input.username !== undefined) changes.username = input.username;
        if (passwordHash !== undefined) changes.passwordHash = passwordHash;
        if (input.role !== undefined) changes.role = input.role;
        if (input.isActive !== undefined) changes.isActive = input.isActive;

        const [updated] = await tx
          .update(users)
          .set(changes)
          .where(eq(users.id, id))
          .returning({
            id: users.id,
            username: users.username,
            role: users.role,
            isActive: users.isActive,
            updatedAt: users.updatedAt,
          });
        if (!updated) throw new NotFoundException('User not found');

        if (
          input.password !== undefined ||
          input.role !== undefined ||
          input.isActive === false
        ) {
          await tx
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
        }
        return updated;
      });
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
        this.assertCashierStatusTarget(user.role);

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

    return this.database.db.transaction(async (tx) => {
      const [user] = await tx
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!user) throw new NotFoundException('User not found');
      this.assertCashierStatusTarget(user.role);

      const [updated] = await tx
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
      return updated;
    });
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

  private assertCashierStatusTarget(role: string) {
    if (role !== 'CASHIER') {
      throw new ForbiddenException(
        'Only cashier account status can be changed here',
      );
    }
  }

  private getUpdatePermission(
    actor: AuthenticatedUser,
    target: { id: string; role: 'OWNER' | 'ADMIN' | 'CASHIER' },
  ) {
    if (actor.id === target.id) return PERMISSIONS.usersUpdateOwnPassword;
    if (actor.role === 'OWNER' && target.role === 'ADMIN') {
      return PERMISSIONS.usersUpdateAdminProfile;
    }
    if (actor.role === 'OWNER' && target.role === 'CASHIER') {
      return PERMISSIONS.usersUpdateCashierProfile;
    }
    if (actor.role === 'ADMIN' && target.role === 'CASHIER') {
      return PERMISSIONS.usersUpdateCashierCredentials;
    }
    throw new ForbiddenException();
  }

  private getAllowedUpdateFields(
    actor: AuthenticatedUser,
    target: { id: string; role: 'OWNER' | 'ADMIN' | 'CASHIER' },
  ): (keyof UpdateUserDto)[] {
    if (actor.id === target.id) return ['password'];
    if (actor.role === 'OWNER' && target.role === 'ADMIN') {
      return ['username', 'password'];
    }
    if (actor.role === 'OWNER' && target.role === 'CASHIER') {
      return ['username', 'password', 'role', 'isActive'];
    }
    if (actor.role === 'ADMIN' && target.role === 'CASHIER') {
      return ['username', 'password'];
    }
    throw new ForbiddenException();
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
