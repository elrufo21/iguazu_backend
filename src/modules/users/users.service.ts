import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        username: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.getUserOrThrow(id);
  }

  async create(dto: CreateUserDto) {
    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: {
          id: dto.employeeId,
        },
      });

      if (!employee) {
        throw new NotFoundException('El empleado no existe.');
      }

      const employeeHasUser = await this.prisma.user.findFirst({
        where: {
          employeeId: dto.employeeId,
        },
      });

      if (employeeHasUser) {
        throw new ConflictException('El empleado ya tiene un usuario.');
      }
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (usernameExists) {
      throw new ConflictException('El nombre de usuario ya existe.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
        username: dto.username,
        passwordHash,
        role: dto.role,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.getUserOrThrow(id);

    if (dto.username) {
      const usernameExists = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: {
            id,
          },
        },
      });

      if (usernameExists) {
        throw new ConflictException('El nombre de usuario ya existe.');
      }
    }

    const data: any = {
      username: dto.username,
      role: dto.role,
      active: dto.active,
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
      include: {
        employee: true,
      },
    });
  }

  async toggleActive(id: number) {
    const user = await this.getUserOrThrow(id);

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        active: !user.active,
      },
    });
  }

  private async getUserOrThrow(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }
}
