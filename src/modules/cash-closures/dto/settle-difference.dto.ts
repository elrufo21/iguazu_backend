import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SettleDifferenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  reason!: string;
}
