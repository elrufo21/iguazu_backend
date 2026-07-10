import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  in(dto: CreateInventoryMovementDto, userId: number) {
    return this.record(InventoryMovementType.IN, dto, userId);
  }

  out(dto: CreateInventoryMovementDto, userId: number) {
    return this.record(InventoryMovementType.OUT, dto, userId);
  }

  loss(dto: CreateInventoryMovementDto, userId: number) {
    return this.record(InventoryMovementType.LOSS, dto, userId);
  }

  adjust(dto: CreateInventoryMovementDto, userId: number) {
    // ADJUSTMENT usa quantity relativo: positivo suma stock, negativo resta.
    return this.record(InventoryMovementType.ADJUSTMENT, dto, userId);
  }

  movements() {
    return this.prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true, user: true },
    });
  }

  movementsByProduct(productId: number) {
    return this.prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  record(
    type: InventoryMovementType,
    dto: CreateInventoryMovementDto,
    userId: number,
    db: any = this.prisma,
  ) {
    return db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product || !product.active) {
        throw new NotFoundException('Producto activo no encontrado.');
      }

      // Si es ingreso (IN), la quantity del DTO representa paquetes/cajas.
      // Se multiplica por purchaseFactor para obtener unidades de stock.
      const stockDelta = this.normalizedQuantity(
        type,
        dto.quantity,
        type === InventoryMovementType.IN ? product.purchaseFactor : 1,
      );
      const nextStock = product.stock + stockDelta;
      if (nextStock < 0) throw new BadRequestException('Stock insuficiente.');

      await tx.product.update({
        where: { id: product.id },
        data: { stock: nextStock },
      });

      return tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type,
          quantity: dto.quantity,
          reason: dto.reason,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          userId,
        },
        include: { product: true, user: true },
      });
    });
  }

  private normalizedQuantity(
    type: InventoryMovementType,
    quantity: number,
    purchaseFactor = 1,
  ) {
    if (type !== InventoryMovementType.ADJUSTMENT && quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero.');
    }

    if (type === InventoryMovementType.IN) return quantity * purchaseFactor;
    if (type === InventoryMovementType.ADJUSTMENT) return quantity;
    return -quantity;
  }
}
