import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PenaltyStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePenaltyDto } from './dto/create-penalty.dto';

@Injectable()
export class PenaltiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePenaltyDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, active: true },
    });
    if (!employee) {
      throw new NotFoundException('Empleado activo no encontrado.');
    }

    return this.prisma.penalty.create({
      data: {
        employeeId: dto.employeeId,
        amount: dto.amount,
        reason: dto.reason,
        date: new Date(dto.date),
        status: PenaltyStatus.PENDING,
      },
      include: { employee: true },
    });
  }

  findAll() {
    return this.prisma.penalty.findMany({
      orderBy: { date: 'desc' },
      include: { employee: true },
    });
  }

  async findByEmployee(employeeId: number) {
    return this.prisma.penalty.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      include: { employee: true },
    });
  }

  async void(id: number) {
    const penalty = await this.prisma.penalty.findUnique({ where: { id } });
    if (!penalty) throw new NotFoundException('Penalidad no encontrada.');
    if (penalty.status === PenaltyStatus.APPLIED) {
      throw new BadRequestException(
        'La penalidad ya fue aplicada en un pago. Anula el pago para revertirla.',
      );
    }
    if (penalty.status === PenaltyStatus.VOIDED) {
      throw new BadRequestException('La penalidad ya está anulada.');
    }

    return this.prisma.penalty.update({
      where: { id },
      data: { status: PenaltyStatus.VOIDED },
      include: { employee: true },
    });
  }

  /**
   * Penalidades pendientes de un empleado hasta una fecha límite.
   * Usado por StaffPaymentsService al calcular el neto.
   */
  pendingForEmployee(employeeId: number, upTo: Date) {
    return this.prisma.penalty.findMany({
      where: {
        employeeId,
        status: PenaltyStatus.PENDING,
        date: { lte: upTo },
      },
      orderBy: { date: 'asc' },
    });
  }
}
