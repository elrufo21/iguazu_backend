import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePriceTypeDto } from './create-price-type.dto';

export class UpdatePriceTypeDto extends PartialType(CreatePriceTypeDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
