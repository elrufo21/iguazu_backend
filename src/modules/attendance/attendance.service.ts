import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    await this.ensureActiveEmployee(dto.employeeId);
    const date = new Date(dto.date);
    const exists = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (exists)
      throw new ConflictException('Ya existe asistencia para ese día.');
    return this.prisma.attendance.create({ data: { ...dto, date } });
  }

  async markCheckIn(id: number) {
    const attendance = await this.findOwned(id);
    if (attendance.checkIn) {
      throw new ConflictException('La entrada ya fue registrada.');
    }
    return this.prisma.attendance.update({
      where: { id },
      data: { checkIn: new Date() },
    });
  }

  async markCheckOut(id: number) {
    const attendance = await this.findOwned(id);
    if (!attendance.checkIn) {
      throw new BadRequestException('La entrada no fue registrada.');
    }
    if (attendance.checkOut) {
      throw new ConflictException('La salida ya fue registrada.');
    }
    return this.prisma.attendance.update({
      where: { id },
      data: { checkOut: new Date() },
    });
  }

  private async findOwned(id: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) {
      throw new NotFoundException('Asistencia no encontrada.');
    }
    return attendance;
  }

  byEmployee(employeeId: number) {
    return this.prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  }

  byRange(from: string, to: string) {
    return this.prisma.attendance.findMany({
      where: { date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { date: 'desc' },
      include: { employee: true },
    });
  }

  private async ensureActiveEmployee(id: number) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, active: true },
    });
    if (!employee)
      throw new NotFoundException('Empleado activo no encontrado.');
  }
}
