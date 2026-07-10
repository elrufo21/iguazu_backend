import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRoomTypePriceDto } from './create-room-type-price.dto';

export class UpdateRoomTypePriceDto extends PartialType(
  CreateRoomTypePriceDto,
) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
