import { BadRequestException, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { auditLogs, users } from '../drizzle/schema/index.js';
import { AUDIT_ACTIONS, type AuditLogsQueryDto } from './audit-logs.dto.js';

const SECRET_KEY = /password|token|cookie|secret|credential/i;
function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !SECRET_KEY.test(k))
        .map(([k, v]) => [k, scrub(v)]),
    );
  return value;
}
export function sanitizedAuditMetadata(metadata: unknown) {
  return scrub(metadata) as Record<string, unknown> | null;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly database: DatabaseService) {}
  async record(
    input: {
      userId?: string | null;
      action: (typeof AUDIT_ACTIONS)[number];
      entityType: string;
      entityId?: string | null;
      description: string;
      metadata?: unknown;
    },
    executor = this.database.db,
  ) {
    if (!(AUDIT_ACTIONS as readonly string[]).includes(input.action))
      throw new BadRequestException('Unsupported audit action');
    return executor
      .insert(auditLogs)
      .values({
        ...input,
        userId: input.userId ?? null,
        entityId: input.entityId ?? null,
        metadata: sanitizedAuditMetadata(input.metadata),
      })
      .returning();
  }
  async list(q: AuditLogsQueryDto, operational: boolean) {
    if (
      q.startDate &&
      q.endDate &&
      Date.parse(q.startDate) > Date.parse(q.endDate)
    )
      throw new BadRequestException('endDate must not precede startDate');
    const filters = [];
    if (q.startDate)
      filters.push(gte(auditLogs.createdAt, new Date(q.startDate)));
    if (q.endDate) {
      const end = new Date(q.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.endDate))
        end.setUTCDate(end.getUTCDate() + 1);
      filters.push(lt(auditLogs.createdAt, end));
    }
    if (q.userId) filters.push(eq(auditLogs.userId, q.userId));
    if (q.action) filters.push(eq(auditLogs.action, q.action));
    if (q.entityType) filters.push(eq(auditLogs.entityType, q.entityType));
    if (q.entityId) filters.push(eq(auditLogs.entityId, q.entityId));
    if (operational)
      filters.push(
        sql`${auditLogs.entityType} in ('PRODUCT','CATEGORY','ADDON','INVENTORY','TRANSACTION','SHIFT','CASH_MOVEMENT') and ${auditLogs.action} not like 'AUTH_%'`,
      );
    const where = and(...filters);
    const [data, [n]] = await Promise.all([
      this.database.db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          username: users.username,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          description: auditLogs.description,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.userId))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(q.limit)
        .offset((q.page - 1) * q.limit),
      this.database.db.select({ total: count() }).from(auditLogs).where(where),
    ]);
    return { data, page: q.page, limit: q.limit, total: Number(n.total) };
  }
}
