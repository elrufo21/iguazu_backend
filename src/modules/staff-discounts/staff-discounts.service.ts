import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashMovementCategory,
  CashMovementType,
  PaymentMethod,
} from '@prisma/client';
import { CashMovementsService } from '../cash-movements/cash-movements.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStaffDiscountDto } from './dto/create-staff-discount.dto';

@Injectable()
export class StaffDiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashMovements: CashMovementsService,
  ) {}

  async create(dto: CreateStaffDiscountDto, userId: number) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, active: true },
    });
    if (!employee)
      throw new NotFoundException('Empleado activo no encontrado.');

    return this.prisma.$transaction(async (tx) => {
      let cashMovementId: number | undefined;
      if (dto.chargeNow) {
        if (!dto.paymentMethod)
          throw new BadRequestException('paymentMethod es requerido.');
        const movement = await this.cashMovements.record(
          {
            userId,
            type: CashMovementType.INCOME,
            category: CashMovementCategory.PRODUCT_LOSS_CHARGE,
            amount: dto.amount,
            paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
            description: dto.reason,
            referenceType: 'STAFF_DISCOUNT',
          },
          tx,
        );
        cashMovementId = movement.id;
      }

      const discount = await tx.staffDiscount.create({
        data: {
          employeeId: dto.employeeId,
          amount: dto.amount,
          reason: dto.reason,
          inventoryMovementId: dto.inventoryMovementId,
          stayId: dto.stayId,
          cashMovementId,
        },
        include: {
          employee: true,
          inventoryMovement: true,
          cashMovement: true,
        },
      });

      if (cashMovementId) {
        await tx.cashMovement.update({
          where: { id: cashMovementId },
          data: { referenceId: discount.id },
        });
      }

      return discount;
    });
  }

  findAll() {
    return this.prisma.staffDiscount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { employee: true, inventoryMovement: true, cashMovement: true },
    });
  }
}
