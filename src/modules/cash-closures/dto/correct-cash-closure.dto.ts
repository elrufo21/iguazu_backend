import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CountedAmountDto } from './close-cash-shift.dto';

export class CorrectCashClosureDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountedAmountDto)
  countedAmounts!: CountedAmountDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  reason!: string;
}
