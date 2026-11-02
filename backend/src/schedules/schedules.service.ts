import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { and, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { schedules, users } from '../drizzle/schema/index.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import type {
  CreateScheduleDto,
  ScheduleStatusInput,
} from './dto/create-schedule.dto.js';
import type { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import type { ListSchedulesDto } from './dto/list-schedules.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async findAll(query: ListSchedulesDto, actor: AuthenticatedUser) {
    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const filters = [];

    // Access control: Cashier can only see their own schedules unless granted schedulesReadAll
    if (!roleHasPermission(actor.role, PERMISSIONS.schedulesReadAll)) {
      filters.push(eq(schedules.userId, actor.id));
    } else if (query.userId) {
      filters.push(eq(schedules.userId, query.userId));
    }

    if (query.shiftType) {
      filters.push(eq(schedules.shiftType, query.shiftType));
    }

    if (query.status) {
      filters.push(eq(schedules.status, query.status));
    }

    if (query.startDate) {
      filters.push(gte(schedules.date, query.startDate));
    }

    if (query.endDate) {
      filters.push(lte(schedules.date, query.endDate));
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      filters.push(
        or(
          ilike(users.username, term),
          ilike(schedules.notes, term),
          ilike(schedules.shiftName, term),
        ),
      );
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const rows = await this.database.db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        userName: users.username,
        userRole: users.role,
        shiftType: schedules.shiftType,
        shiftName: schedules.shiftName,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
      })
      .from(schedules)
      .innerJoin(users, eq(schedules.userId, users.id))
      .where(whereClause)
      .orderBy(desc(schedules.date), desc(schedules.startTime));

    return rows;
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const [schedule] = await this.database.db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        userName: users.username,
        userRole: users.role,
        shiftType: schedules.shiftType,
        shiftName: schedules.shiftName,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
      })
      .from(schedules)
      .innerJoin(users, eq(schedules.userId, users.id))
      .where(eq(schedules.id, id))
      .limit(1);

    if (!schedule) {
      throw new NotFoundException('Jadwal shift tidak ditemukan');
    }

    if (
      !roleHasPermission(actor.role, PERMISSIONS.schedulesReadAll) &&
      schedule.userId !== actor.id
    ) {
      throw new ForbiddenException('Akses ditolak');
    }

    return schedule;
  }

  async create(input: CreateScheduleDto, actor: AuthenticatedUser) {
    // Validate target user exists
    const [targetUser] = await this.database.db
      .select({ id: users.id, username: users.username, role: users.role })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('Karyawan yang dipilih tidak ditemukan');
    }

    const [created] = await this.database.db
      .insert(schedules)
      .values({
        userId: input.userId,
        shiftType: input.shiftType,
        shiftName: input.shiftName,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: input.status || 'SCHEDULED',
        notes: input.notes,
      })
      .returning();

    await this.auditLogs?.record({
      userId: actor.id,
      action: 'SCHEDULE_CREATED',
      entityType: 'SCHEDULE',
      entityId: created.id,
      description: `Jadwal shift dibuat untuk ${targetUser.username}`,
      metadata: {
        userId: input.userId,
        date: input.date,
        shiftType: input.shiftType,
      },
    });

    return {
      ...created,
      userName: targetUser.username,
      userRole: targetUser.role,
    };
  }

  async update(id: string, input: UpdateScheduleDto, actor: AuthenticatedUser) {
    const [existing] = await this.database.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Jadwal shift tidak ditemukan');
    }

    if (input.userId && input.userId !== existing.userId) {
      const [targetUser] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!targetUser) {
        throw new NotFoundException('Karyawan yang dipilih tidak ditemukan');
      }
    }

    const [updated] = await this.database.db
      .update(schedules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();

    const [full] = await this.database.db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        userName: users.username,
        userRole: users.role,
        shiftType: schedules.shiftType,
        shiftName: schedules.shiftName,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
      })
      .from(schedules)
      .innerJoin(users, eq(schedules.userId, users.id))
      .where(eq(schedules.id, id))
      .limit(1);

    await this.auditLogs?.record({
      userId: actor.id,
      action: 'SCHEDULE_UPDATED',
      entityType: 'SCHEDULE',
      entityId: id,
      description: `Jadwal shift diperbarui`,
      metadata: input,
    });

    return full;
  }

  async updateStatus(
    id: string,
    status: ScheduleStatusInput,
    actor: AuthenticatedUser,
  ) {
    const [existing] = await this.database.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Jadwal shift tidak ditemukan');
    }

    // Cashier can only update status of their own schedule
    if (
      !roleHasPermission(actor.role, PERMISSIONS.schedulesManage) &&
      existing.userId !== actor.id
    ) {
      throw new ForbiddenException('Akses ditolak');
    }

    const [updated] = await this.database.db
      .update(schedules)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();

    const [full] = await this.database.db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        userName: users.username,
        userRole: users.role,
        shiftType: schedules.shiftType,
        shiftName: schedules.shiftName,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
      })
      .from(schedules)
      .innerJoin(users, eq(schedules.userId, users.id))
      .where(eq(schedules.id, id))
      .limit(1);

    return full;
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const [existing] = await this.database.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Jadwal shift tidak ditemukan');
    }

    await this.database.db.delete(schedules).where(eq(schedules.id, id));

    await this.auditLogs?.record({
      userId: actor.id,
      action: 'SCHEDULE_DELETED',
      entityType: 'SCHEDULE',
      entityId: id,
      description: `Jadwal shift dihapus`,
    });

    return { success: true, id };
  }

  async removeMultiple(ids: string[], actor: AuthenticatedUser) {
    if (!ids.length) return { success: true, count: 0 };

    await this.database.db.delete(schedules).where(inArray(schedules.id, ids));

    await this.auditLogs?.record({
      userId: actor.id,
      action: 'SCHEDULES_BATCH_DELETED',
      entityType: 'SCHEDULE',
      description: `${ids.length} jadwal shift dihapus`,
      metadata: { ids },
    });

    return { success: true, count: ids.length };
  }
}
