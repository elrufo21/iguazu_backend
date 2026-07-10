import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class OpenCashShiftDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingAmount!: number;
}
