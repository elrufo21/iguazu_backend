import { Module } from '@nestjs/common';
import { CashShiftController } from './cash-shift.controller';
import { CashShiftService } from './cash-shift.service';

@Module({
  controllers: [CashShiftController],
  providers: [CashShiftService],
  exports: [CashShiftService],
})
export class CashShiftModule {}
