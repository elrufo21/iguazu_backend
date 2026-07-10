import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePriceTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
