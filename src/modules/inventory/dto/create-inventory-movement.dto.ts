import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInventoryMovementDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  referenceId?: number;
}
