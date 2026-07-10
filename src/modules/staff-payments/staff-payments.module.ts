import { Module } from '@nestjs/common';
import { CashMovementsModule } from '../cash-movements/cash-movements.module';
import { StaffPaymentsController } from './staff-payments.controller';
import { StaffPaymentsService } from './staff-payments.service';

@Module({
  imports: [CashMovementsModule],
  controllers: [StaffPaymentsController],
  providers: [StaffPaymentsService],
})
export class StaffPaymentsModule {}
