import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import { ShiftsService } from './shifts.service.js';

@Controller('shifts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Permissions(PERMISSIONS.shiftsOpen)
  open(@Body() body: OpenShiftDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftsService.open(body, actor);
  }

  @Get('current')
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  getCurrent(@CurrentUser() actor: AuthenticatedUser) {
    return this.shiftsService.getCurrent(actor);
  }

  @Get()
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  list(@CurrentUser() actor: AuthenticatedUser) {
    return this.shiftsService.list(actor);
  }

  @Post(':id/close')
  @AnyPermissions(PERMISSIONS.shiftsCloseOwn, PERMISSIONS.shiftsCloseAny)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CloseShiftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.close(id, body, actor);
  }

  @Post(':id/cash-movements')
  @Permissions(PERMISSIONS.cashMovementsCreate)
  createCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateCashMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.createCashMovement(id, body, actor);
  }
}
