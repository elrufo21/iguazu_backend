import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: CreateAuditLogDto, db: any = this.prisma) {
    return db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData as any,
        newData: data.newData as any,
        ip: data.ip,
      },
    });
  }

  findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  findOne(id: number) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: true },
    });
  }
}
