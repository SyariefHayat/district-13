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
  HttpCode,
  HttpStatus,
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
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto.js';
import { UpdateCashMovementDto } from './dto/update-cash-movement.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import { ListShiftsDto } from './dto/list-shifts.dto.js';
import { ShiftsService } from './shifts.service.js';

@Controller('shifts')
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
  create(@Body() body: OpenShiftDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftsService.open(body, actor);
  }

  @Post('open')
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
  list(@Query() query: ListShiftsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.shiftsService.list(query, actor);
  }

  @Get(':id')
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.getById(id, actor);
  }

  @Get(':id/closing-preview')
  @AnyPermissions(
    PERMISSIONS.shiftsCloseOwn,
    PERMISSIONS.shiftsCloseAny,
    PERMISSIONS.shiftsReadOwn,
    PERMISSIONS.shiftsReadAll,
  )
  getClosingPreview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.getClosingPreview(id, actor);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @AnyPermissions(PERMISSIONS.shiftsCloseOwn, PERMISSIONS.shiftsCloseAny)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CloseShiftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.close(id, body, actor);
  }

  @Get(':id/summary')
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  getSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.getSummary(id, actor);
  }

  @Get(':id/cash-entries')
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  getCashEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.getCashEntries(id, actor);
  }

  @Get(':id/cash-movements')
  @AnyPermissions(PERMISSIONS.shiftsReadOwn, PERMISSIONS.shiftsReadAll)
  getCashMovements(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.getCashEntries(id, actor);
  }

  @Post(':id/cash-entries')
  @AnyPermissions(
    PERMISSIONS.cashMovementsCreateOwn,
    PERMISSIONS.cashMovementsCreateAny,
  )
  createCashEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateCashMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.createCashMovement(id, body, actor);
  }

  @Post(':id/cash-movements')
  @AnyPermissions(
    PERMISSIONS.cashMovementsCreateOwn,
    PERMISSIONS.cashMovementsCreateAny,
  )
  createCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateCashMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.createCashMovement(id, body, actor);
  }

  @Patch('cash-movements/:id')
  @Permissions(PERMISSIONS.cashMovementsUpdate)
  updateCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCashMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.updateCashMovement(id, body, actor);
  }

  @Delete('cash-movements/:id')
  @Permissions(PERMISSIONS.cashMovementsDelete)
  deleteCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.deleteCashMovement(id, actor);
  }
}
