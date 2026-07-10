import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class RoomProductQuantityDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class UpdateRoomProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomProductQuantityDto)
  products!: RoomProductQuantityDto[];
}
