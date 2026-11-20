import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { UpdateCashMovementDto } from './dto/update-cash-movement.dto.js';
import { ShiftsService } from './shifts.service.js';

@Controller('cash-entries')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class CashEntriesController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Patch(':id')
  @Permissions(PERMISSIONS.cashMovementsUpdate)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCashMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.updateCashMovement(id, body, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.cashMovementsDelete)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shiftsService.deleteCashMovement(id, actor);
  }
}
