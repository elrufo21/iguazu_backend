import { InventoryMovementType, SaleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  cashShiftId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsEnum(InventoryMovementType)
  @IsOptional()
  type?: InventoryMovementType;
}
