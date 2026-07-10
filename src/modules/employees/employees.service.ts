import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      where: {
        active: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.getEmployeeOrThrow(id);
  }

  async create(dto: CreateEmployeeDto) {
    const exists = await this.prisma.employee.findUnique({
      where: {
        documentNumber: dto.documentNumber,
      },
    });

    if (exists) {
      throw new ConflictException(
        'Ya existe un empleado con ese número de documento.',
      );
    }

    return this.prisma.employee.create({
      data: {
        ...dto,
      },
    });
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    await this.getEmployeeOrThrow(id);

    if (dto.documentNumber) {
      const exists = await this.prisma.employee.findFirst({
        where: {
          documentNumber: dto.documentNumber,
          NOT: {
            id,
          },
        },
      });

      if (exists) {
        throw new ConflictException(
          'Ya existe un empleado con ese número de documento.',
        );
      }
    }

    return this.prisma.employee.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async deactivate(id: number) {
    await this.getEmployeeOrThrow(id);

    return this.prisma.employee.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }

  private async getEmployeeOrThrow(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id,
      },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado.');
    }

    return employee;
  }
}
