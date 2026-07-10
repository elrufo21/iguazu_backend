import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateRoomTypePriceDto {
  @Type(() => Number)
  @IsInt()
  roomTypeId!: number;

  @Type(() => Number)
  @IsInt()
  priceTypeId!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;
}
