import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { PermissionsService } from './permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('available')
  available() {
    return this.permissionsService.available();
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':role')
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
    return this.permissionsService.findByRole(role);
  }

  @Put(':role')
  updateRole(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRole(role, dto);
  }
}
