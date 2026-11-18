import { ForbiddenException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../drizzle/database/database.service.js';
import { shifts, transactions } from '../../drizzle/schema/index.js';
import type { AuthenticatedUser } from '../types/auth.types.js';

@Injectable()
export class OwnershipService {
  constructor(private readonly database: DatabaseService) {}

  assertOwnership(
    resourceOwnerId: string,
    actor: AuthenticatedUser,
    resourceName = 'resource',
  ): void {
    if (resourceOwnerId !== actor.id) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: `Forbidden: you can only access or modify your own ${resourceName}`,
      });
    }
  }

  async assertShiftOwnership(
    shiftId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const [shift] = await this.database.db
      .select({ userId: shifts.userId })
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift || shift.userId !== actor.id) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: 'Forbidden: you can only access or modify your own shift',
      });
    }
  }

  async assertTransactionOwnership(
    transactionId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const [transaction] = await this.database.db
      .select({ userId: transactions.userId })
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction || transaction.userId !== actor.id) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        message: 'Forbidden: you can only access or void your own transaction',
      });
    }
  }
}
