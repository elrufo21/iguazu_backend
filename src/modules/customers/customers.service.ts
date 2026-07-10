import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    this.validateRequired(dto.documentType, dto.documentNumber, dto.fullName);
    await this.ensureDocumentAvailable(dto.documentType, dto.documentNumber);

    return this.prisma.customer.create({ data: dto });
  }

  findAll() {
    return this.prisma.customer.findMany({ orderBy: { fullName: 'asc' } });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');
    return customer;
  }

  findByDocument(documentType: string, documentNumber: string) {
    return this.prisma.customer.findUnique({
      where: { documentType_documentNumber: { documentType, documentNumber } },
    });
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);
    const documentType = dto.documentType;
    const documentNumber = dto.documentNumber;

    if (documentType !== undefined || documentNumber !== undefined) {
      const current = await this.findOne(id);
      await this.ensureDocumentAvailable(
        documentType ?? current.documentType,
        documentNumber ?? current.documentNumber,
        id,
      );
    }

    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  private validateRequired(...values: string[]) {
    if (values.some((value) => !value.trim())) {
      throw new BadRequestException('Documento y nombre son requeridos.');
    }
  }

  private async ensureDocumentAvailable(
    documentType: string,
    documentNumber: string,
    id?: number,
  ) {
    const exists = await this.prisma.customer.findFirst({
      where: { documentType, documentNumber, NOT: id ? { id } : undefined },
    });
    if (exists) throw new ConflictException('El cliente ya existe.');
  }
}
