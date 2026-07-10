import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AVAILABLE_PERMISSIONS } from 'src/common/permissions/available-permissions';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  available() {
    return AVAILABLE_PERMISSIONS;
  }

  findAll() {
    return this.prisma.rolePermission.findMany({
      where: { allowed: true },
      orderBy: [{ role: 'asc' }, { permission: 'asc' }],
    });
  }

  async findByRole(role: UserRole) {
    if (role === UserRole.ADMIN) {
      return ['*'];
    }

    const rows = await this.prisma.rolePermission.findMany({
      where: { role, allowed: true },
      orderBy: { permission: 'asc' },
    });

    return rows.map((row) => row.permission);
  }

  async updateRole(role: UserRole, dto: UpdateRolePermissionsDto) {
    if (role === UserRole.ADMIN) {
      throw new BadRequestException('ADMIN siempre tiene todos los permisos.');
    }

    const invalid = dto.permissions.filter(
      (permission) => !AVAILABLE_PERMISSIONS.includes(permission as any),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Permisos inválidos: ${invalid.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role } });

      if (dto.permissions.length) {
        await tx.rolePermission.createMany({
          data: dto.permissions.map((permission) => ({
            role,
            permission,
          })),
        });
      }

      return tx.rolePermission.findMany({
        where: { role, allowed: true },
        orderBy: { permission: 'asc' },
      });
    });
  }
}
