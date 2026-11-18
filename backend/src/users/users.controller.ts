import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyPermissions,
  Permissions,
} from '../auth/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../auth/permissions/permissions.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto.js';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PERMISSIONS.usersRead)
  findAll() {
    return this.usersService.findAll();
  }

  @Post('me/password')
  @Permissions(PERMISSIONS.usersUpdateOwnPassword)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  changeOwnPassword(
    @Body() body: ChangeOwnPasswordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.changeOwnPassword(currentUser, body);
  }

  @Post()
  @AnyPermissions(
    PERMISSIONS.usersCreate,
    PERMISSIONS.usersUpdateCashierCredentials,
  )
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(
    @Body() body: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.create(
      {
        username: body.username.trim(),
        password: body.password,
        role: body.role,
      },
      currentUser,
    );
  }

  @Patch(':id')
  @AnyPermissions(
    PERMISSIONS.usersUpdateOwnPassword,
    PERMISSIONS.usersUpdateAdminProfile,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateCashierCredentials,
  )
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.update(id, currentUser, {
      username: body.username?.trim(),
      password: body.password,
      role: body.role,
      isActive: body.isActive,
    });
  }

  @Post(':id/reset-password')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  resetPasswordPost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ResetUserPasswordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.resetPassword(id, body.password, currentUser);
  }

  @Patch(':id/reset-password')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  resetPasswordPatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ResetUserPasswordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.resetPassword(id, body.password, currentUser);
  }

  @Post(':id/deactivate')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  deactivatePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, false, currentUser);
  }

  @Patch(':id/deactivate')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  deactivatePatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, false, currentUser);
  }

  @Post(':id/activate')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  activatePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, true, currentUser);
  }

  @Patch(':id/activate')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  activatePatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, true, currentUser);
  }

  @Patch(':id/status')
  @AnyPermissions(
    PERMISSIONS.usersUpdateCashierCredentials,
    PERMISSIONS.usersUpdateCashierProfile,
    PERMISSIONS.usersUpdateAdminProfile,
  )
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, body.isActive, currentUser);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.usersDelete)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}
