import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { SchedulesService } from './schedules.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import {
  BatchDeleteSchedulesDto,
  UpdateScheduleDto,
  UpdateScheduleStatusDto,
} from './dto/update-schedule.dto.js';
import { ListSchedulesDto } from './dto/list-schedules.dto.js';

@Controller('schedules')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @AnyPermissions(PERMISSIONS.schedulesReadAll, PERMISSIONS.schedulesReadOwn)
  findAll(
    @Query() query: ListSchedulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.findAll(query, actor);
  }

  @Get(':id')
  @AnyPermissions(PERMISSIONS.schedulesReadAll, PERMISSIONS.schedulesReadOwn)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.findOne(id, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.schedulesManage)
  create(
    @Body() body: CreateScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.create(body, actor);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.schedulesManage)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.update(id, body, actor);
  }

  @Patch(':id/status')
  @AnyPermissions(PERMISSIONS.schedulesManage, PERMISSIONS.schedulesReadOwn)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateScheduleStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.updateStatus(id, body.status, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.schedulesManage)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.remove(id, actor);
  }

  @Post('batch-delete')
  @Permissions(PERMISSIONS.schedulesManage)
  removeMultiple(
    @Body() body: BatchDeleteSchedulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.schedulesService.removeMultiple(body.ids, actor);
  }
}
