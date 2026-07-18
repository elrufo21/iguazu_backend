jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }), {
  virtual: true,
});

import {
  CashMovementCategory,
  CashMovementType,
  CashShiftStatus,
  PaymentMethod,
  UserRole,
} from '@prisma/client';
import { CashMovementsService } from './cash-movements.service';

describe('CashMovementsService', () => {
  it('registers manual income in the current user open shift', async () => {
    const movement = { id: 2, amount: 25 };
    const prisma = {
      cashShift: {
        findFirst: jest.fn().mockResolvedValue({
          id: 16,
          status: CashShiftStatus.OPEN,
          openedById: 7,
        }),
      },
      cashMovement: { create: jest.fn().mockResolvedValue(movement) },
      auditLog: { create: jest.fn() },
    };
    const service = new CashMovementsService(prisma as any);

    await expect(
      service.income(
        {
          category: CashMovementCategory.CASH_ADJUSTMENT,
          amount: 25,
          paymentMethod: PaymentMethod.CASH,
          description: 'Ingreso extra',
        },
        { sub: 7, role: UserRole.CASHIER },
      ),
    ).resolves.toBe(movement);

    expect(prisma.cashMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cashShiftId: 16,
        type: CashMovementType.INCOME,
        amount: 25,
        referenceType: 'MANUAL',
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CASH_INCOME' }),
    });
  });

  it('lets admins register manual expenses in closed shifts', async () => {
    const movement = { id: 1, amount: 10 };
    const tx = {
      cashShift: {
        findUnique: jest.fn().mockResolvedValue({
          id: 9,
          status: CashShiftStatus.CLOSED,
          openedById: 2,
        }),
      },
      cashMovement: { create: jest.fn().mockResolvedValue(movement) },
      auditLog: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new CashMovementsService(prisma as any);

    await expect(
      service.expense(
        {
          cashShiftId: 9,
          category: CashMovementCategory.CASH_ADJUSTMENT,
          amount: 10,
          paymentMethod: PaymentMethod.CASH,
          description: 'Corrección caja cerrada',
        },
        { sub: 1, role: UserRole.ADMIN },
      ),
    ).resolves.toBe(movement);

    expect(tx.cashMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cashShiftId: 9,
        type: CashMovementType.EXPENSE,
        amount: 10,
      }),
    });
  });
});
