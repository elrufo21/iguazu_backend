import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditLogDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsNotEmpty()
  entity!: string;

  @Type(() => Number)
  @IsInt()
  entityId!: number;

  @IsOptional()
  oldData?: unknown;

  @IsOptional()
  newData?: unknown;

  @IsString()
  @IsOptional()
  ip?: string;
}
