import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { VoidTransactionDto } from './dto/void-transaction.dto.js';
import { TransactionsService } from './transactions.service.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Permissions(PERMISSIONS.transactionsCreate)
  create(
    @Body() body: CreateTransactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.transactionsService.create(body, actor);
  }

  @Post(':id/void')
  @Permissions(PERMISSIONS.transactionsVoid)
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VoidTransactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.transactionsService.void(id, body, actor);
  }
}
