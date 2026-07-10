import { IsNotEmpty, IsString } from 'class-validator';

export class ReverseCashMovementDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
