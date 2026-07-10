import { PartialType } from '@nestjs/swagger';
import { OpenCashShiftDto } from './create-cash-shift.dto';

export class UpdateCashShiftDto extends PartialType(OpenCashShiftDto) {}
