import { hash, verify } from 'argon2';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { and, count, eq, isNull, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  cashMovements,
  inventoryMovements,
  sessions,
  shifts,
  transactions,
  users,
} from '../drizzle/schema/index.js';
import {
  PERMISSIONS,
  roleHasPermission,
  type Permission,
} from '../auth/permissions/permissions.js';
import type { AuthenticatedUser, UserRole } from '../auth/types/auth.types.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { ChangeOwnPasswordDto } from './dto/change-own-password.dto.js';

@Injectable()
export class UsersService {
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

  async create(input: CreateUserDto, actor?: AuthenticatedUser) {
    if (
      actor &&
      actor.role.toUpperCase() === 'ADMIN' &&
      input.role.toUpperCase() !== 'CASHIER'
    ) {
      throw new ForbiddenException(
        'Admin can only create cashier accounts (REQ-F-USR-002 / B-03)',
      );
    }

    const passwordHash = await hash(input.password);
    try {
      return await this.executeTx(async (tx) => {
        const [user] = await tx
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

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          await this.auditLogs.record(
            {
              userId: actor?.id ?? null,
              action: 'USER_CREATED',
              entityType: 'USER',
              entityId: user.id,
              description: `User ${user.username} created with role ${user.role}`,
              metadata: {
                username: user.username,
                role: user.role,
                isActive: true,
              },
            },
            tx as never,
          );
        }

        return user;
      });
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

    const isSelf = actor.id === id;
    if (isSelf && input.role !== undefined && input.role !== actor.role) {
      throw new ForbiddenException('Cannot change your own role');
    }
    if (isSelf && input.isActive === false) {
      throw new BadRequestException(
        'You cannot deactivate or delete your own account',
      );
    }

    const passwordHash =
      input.password !== undefined ? await hash(input.password) : undefined;

    try {
      return await this.executeTx(async (tx) => {
        const [target] = await tx
          .select({
            id: users.id,
            username: users.username,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (!target) throw new NotFoundException('User not found');

        const actorRole = actor.role.toUpperCase();
        const targetRole = target.role.toUpperCase();

        if (actorRole === 'ADMIN') {
          if (targetRole === 'ADMIN' || targetRole === 'OWNER') {
            throw new ForbiddenException(
              'Admin is not permitted to modify Admin or Owner accounts',
            );
          }
          if (
            input.role !== undefined &&
            input.role.toUpperCase() !== 'CASHIER'
          ) {
            throw new ForbiddenException('Admin cannot change cashier role');
          }
        }

        if (
          actorRole === 'OWNER' &&
          targetRole === 'OWNER' &&
          input.isActive === false
        ) {
          await lockOwnerLifecycle(tx);
          await this.assertAnotherActiveOwner(tx);
        }

        const updatePermission = this.getUpdatePermission(actor, target);
        if (
          actorRole !== 'OWNER' &&
          !roleHasPermission(actor.role, updatePermission)
        ) {
          throw new ForbiddenException();
        }

        const allowedFields = this.getAllowedUpdateFields(
          isSelf,
          updatePermission,
          actorRole,
        );
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

        if (this.auditLogs && typeof this.auditLogs.record === 'function') {
          const action =
            input.role !== undefined && input.role !== target.role
              ? 'USER_ROLE_CHANGED'
              : 'USER_UPDATED';
          await this.auditLogs.record(
            {
              userId: actor.id,
              action,
              entityType: 'USER',
              entityId: id,
              description: `User ${target.username} updated`,
              metadata: {
                targetUsername: target.username,
                targetRole: target.role,
                changes: {
                  ...(input.username !== undefined
                    ? { username: input.username }
                    : {}),
                  ...(input.role !== undefined ? { role: input.role } : {}),
                  ...(input.isActive !== undefined
                    ? { isActive: input.isActive }
                    : {}),
                  ...(input.password !== undefined
                    ? { passwordUpdated: true }
                    : {}),
                },
              },
            },
            tx as never,
          );
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

  async updateStatus(
    id: string,
    isActive: boolean,
    actorOrUserId: AuthenticatedUser | string,
  ) {
    const actor: AuthenticatedUser =
      typeof actorOrUserId === 'string'
        ? {
            id: actorOrUserId,
            role: 'OWNER',
            sessionId: 'system',
          }
        : actorOrUserId;

    if (!isActive) this.assertNotSelf(id, actor.id);

    return this.executeTx(async (tx) => {
      await lockOwnerLifecycle(tx);
      const [user] = await tx
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!user) throw new NotFoundException('User not found');

      const actorRole = actor.role.toUpperCase();
      const targetRole = user.role.toUpperCase();

      this.assertCashierStatusTarget(user.role);

      if (actorRole === 'ADMIN') {
        if (targetRole !== 'CASHIER') {
          throw new ForbiddenException(
            'Admin can only modify cashier accounts',
          );
        }
      }

      if (targetRole === 'OWNER' && !isActive) {
        await this.assertAnotherActiveOwner(tx);
      }

      const [updated] = await tx
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          updatedAt: users.updatedAt,
        });

      if (!isActive) {
        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
      }

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            entityType: 'USER',
            entityId: id,
            description: `User ${user.username} ${isActive ? 'activated' : 'deactivated'}`,
            metadata: {
              username: user.username,
              role: user.role,
              isActive,
            },
          },
          tx as never,
        );
      }

      return updated;
    });
  }

  async resetPassword(
    id: string,
    newPasswordPlain: string,
    actor: AuthenticatedUser,
  ) {
    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    return this.executeTx(async (tx) => {
      const [target] = await tx
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!target) throw new NotFoundException('User not found');

      const actorRole = actor.role.toUpperCase();
      const targetRole = target.role.toUpperCase();

      if (actorRole === 'ADMIN' && targetRole !== 'CASHIER') {
        throw new ForbiddenException(
          'Admin can only reset cashier credentials',
        );
      }

      const passwordHash = await hash(newPasswordPlain);
      const [updated] = await tx
        .update(users)
        .set({
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
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

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'USER_PASSWORD_RESET',
            entityType: 'USER',
            entityId: id,
            description: `Password reset for user ${target.username}`,
            metadata: {
              targetUsername: target.username,
              targetRole: target.role,
            },
          },
          tx as never,
        );
      }

      return updated;
    });
  }

  async changeOwnPassword(
    actor: AuthenticatedUser,
    input: ChangeOwnPasswordDto,
  ) {
    if (actor.role.toUpperCase() === 'CASHIER') {
      throw new ForbiddenException(
        'Cashier password can only be reset by Admin or Owner (REQ-F-USR-005)',
      );
    }

    return this.executeTx(async (tx) => {
      const [user] = await tx
        .select({
          id: users.id,
          username: users.username,
          passwordHash: users.passwordHash,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, actor.id))
        .limit(1);
      if (!user) throw new NotFoundException('User not found');

      const isCurrentValid = await verify(
        user.passwordHash,
        input.currentPassword,
      );
      if (!isCurrentValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const newPasswordHash = await hash(input.newPassword);
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          failedLoginCount: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, actor.id));

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'USER_PASSWORD_RESET',
            entityType: 'USER',
            entityId: actor.id,
            description: `User ${user.username} changed own password`,
            metadata: {
              username: user.username,
              role: user.role,
              selfUpdate: true,
            },
          },
          tx as never,
        );
      }

      return { success: true, message: 'Password changed successfully' };
    });
  }

  async remove(
    id: string,
    actorOrUserId: AuthenticatedUser | string,
  ): Promise<{ success: true }> {
    const actor: AuthenticatedUser =
      typeof actorOrUserId === 'string'
        ? {
            id: actorOrUserId,
            role: 'OWNER',
            sessionId: 'system',
          }
        : actorOrUserId;

    this.assertNotSelf(id, actor.id);

    if (actor.role.toUpperCase() !== 'OWNER') {
      throw new ForbiddenException('Only owners can delete user accounts');
    }

    return this.executeTx(async (tx) => {
      await lockOwnerLifecycle(tx);
      const [user] = await tx
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!user) throw new NotFoundException('User not found');

      if (user.role === 'OWNER' && user.isActive) {
        await this.assertAnotherActiveOwner(tx);
      }

      // Check relation constraints: shifts, transactions, inventoryMovements, cashMovements
      try {
        const shiftRes = await tx
          .select({ total: count() })
          .from(shifts)
          .where(or(eq(shifts.userId, id), eq(shifts.closedBy, id)));
        const shiftTotal =
          Array.isArray(shiftRes) && shiftRes[0]
            ? Number(shiftRes[0].total)
            : 0;
        if (shiftTotal > 0) {
          throw new ConflictException(
            'Cannot delete user with existing shifts or operational records. Deactivate the account instead (REQ-F-USR-002).',
          );
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }

      try {
        const txRes = await tx
          .select({ total: count() })
          .from(transactions)
          .where(
            or(eq(transactions.userId, id), eq(transactions.voidedBy, id)),
          );
        const txTotal =
          Array.isArray(txRes) && txRes[0] ? Number(txRes[0].total) : 0;
        if (txTotal > 0) {
          throw new ConflictException(
            'Cannot delete user with existing sales or transactions. Deactivate the account instead (REQ-F-USR-002).',
          );
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }

      try {
        const invRes = await tx
          .select({ total: count() })
          .from(inventoryMovements)
          .where(eq(inventoryMovements.userId, id));
        const invTotal =
          Array.isArray(invRes) && invRes[0] ? Number(invRes[0].total) : 0;
        if (invTotal > 0) {
          throw new ConflictException(
            'Cannot delete user with existing inventory movements. Deactivate the account instead (REQ-F-USR-002).',
          );
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }

      try {
        const cashRes = await tx
          .select({ total: count() })
          .from(cashMovements)
          .where(eq(cashMovements.recordedBy, id));
        const cashTotal =
          Array.isArray(cashRes) && cashRes[0] ? Number(cashRes[0].total) : 0;
        if (cashTotal > 0) {
          throw new ConflictException(
            'Cannot delete user with existing cash movements. Deactivate the account instead (REQ-F-USR-002).',
          );
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
      }

      try {
        await tx.delete(users).where(eq(users.id, id));
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw new ConflictException(
            'Cannot delete user with existing related records. Deactivate the account instead (REQ-F-USR-002).',
          );
        }
        throw err;
      }

      if (this.auditLogs && typeof this.auditLogs.record === 'function') {
        await this.auditLogs.record(
          {
            userId: actor.id,
            action: 'USER_DELETED',
            entityType: 'USER',
            entityId: id,
            description: `User ${user.username} deleted`,
            metadata: {
              username: user.username,
              role: user.role,
            },
          },
          tx as never,
        );
      }

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
    target: { id: string; role: UserRole },
  ) {
    if (actor.id === target.id) return PERMISSIONS.usersUpdateOwnPassword;
    const targetRole = target.role.toUpperCase();
    if (targetRole === 'OWNER') {
      return PERMISSIONS.usersUpdateAdminProfile;
    }
    if (targetRole === 'ADMIN') {
      return PERMISSIONS.usersUpdateAdminProfile;
    }
    if (
      targetRole === 'CASHIER' &&
      roleHasPermission(actor.role, PERMISSIONS.usersUpdateCashierProfile)
    ) {
      return PERMISSIONS.usersUpdateCashierProfile;
    }
    if (targetRole === 'CASHIER') {
      return PERMISSIONS.usersUpdateCashierCredentials;
    }
    throw new ForbiddenException();
  }

  private getAllowedUpdateFields(
    isSelf: boolean,
    permission: Permission,
    actorRole?: string,
  ): (keyof UpdateUserDto)[] {
    if (isSelf) return ['username', 'password'];
    if (actorRole === 'OWNER') {
      return ['username', 'password', 'role', 'isActive'];
    }
    if (permission === PERMISSIONS.usersUpdateAdminProfile) {
      return ['username', 'password'];
    }
    if (permission === PERMISSIONS.usersUpdateCashierProfile) {
      return ['username', 'password', 'role', 'isActive'];
    }
    if (permission === PERMISSIONS.usersUpdateCashierCredentials) {
      return ['username', 'password', 'isActive'];
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
  if (typeof (tx as any).execute === 'function') {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(29475, 1)`);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23503'
  );
}
