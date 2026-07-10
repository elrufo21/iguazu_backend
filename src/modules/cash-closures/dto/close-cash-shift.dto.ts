import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CountedAmountDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  countedAmount!: number;
}

export class CloseCashShiftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountedAmountDto)
  countedAmounts!: CountedAmountDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
