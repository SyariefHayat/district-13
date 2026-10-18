import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { ListTransactionsDto } from './dto/list-transactions.dto.js';
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
    @Headers('idempotency-key') key: string | undefined,
  ) {
    if (!key || !isUuid(key))
      throw new BadRequestException('Idempotency-Key must be a UUID');
    return this.transactionsService.create(body, actor, key);
  }

  @Get()
  @AnyPermissions(
    PERMISSIONS.transactionsReadOwn,
    PERMISSIONS.transactionsReadAll,
  )
  list(
    @Query() query: ListTransactionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.transactionsService.list(query, actor);
  }

  @Get(':id')
  @AnyPermissions(
    PERMISSIONS.transactionsReadOwn,
    PERMISSIONS.transactionsReadAll,
  )
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.transactionsService.get(id, actor);
  }

  @Post(':id/void')
  @Permissions(PERMISSIONS.transactionsVoid)
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VoidTransactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.transactionsService.void(id, body.reason, actor);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
