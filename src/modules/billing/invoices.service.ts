import { Injectable } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Acceso a datos de comprobantes + numeración correlativa por serie.
 */
@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserva el siguiente correlativo de una serie de forma segura.
   * Usa una transacción con incremento atómico para evitar duplicados.
   */
  async nextCorrelativo(serie: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      // Upssert del contador si no existe, luego incremento atómico.
      const counter = await tx.invoiceCounter.upsert({
        where: { serie },
        update: { current: { increment: 1 } },
        create: { serie, current: 1 },
      });
      return counter.current;
    });
  }

  /** Inicializa el contador de una serie (para seed / configuración). */
  async ensureCounter(serie: string) {
    return this.prisma.invoiceCounter.upsert({
      where: { serie },
      update: {},
      create: { serie, current: 0 },
    });
  }

  create(data: Prisma.InvoiceCreateInput) {
    return this.prisma.invoice.create({ data });
  }

  update(id: number, data: Prisma.InvoiceUpdateInput) {
    return this.prisma.invoice.update({ where: { id }, data });
  }

  findAll() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sale: { select: { id: true, total: true, status: true } },
        emittedBy: { select: { id: true, username: true } },
        affectedInvoice: { select: { id: true, docNumber: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: { include: { details: true, customer: true } },
        emittedBy: { select: { id: true, username: true } },
        affectedInvoice: { select: { id: true, docNumber: true } },
        affectingInvoices: { select: { id: true, docNumber: true } },
      },
    });
  }

  findBySale(saleId: number) {
    return this.prisma.invoice.findUnique({ where: { saleId } });
  }

  byStatus(status: InvoiceStatus) {
    return this.prisma.invoice.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }
}
