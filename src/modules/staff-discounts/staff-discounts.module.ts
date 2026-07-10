import { Module } from '@nestjs/common';
import { CashMovementsModule } from '../cash-movements/cash-movements.module';
import { StaffDiscountsController } from './staff-discounts.controller';
import { StaffDiscountsService } from './staff-discounts.service';

@Module({
  imports: [CashMovementsModule],
  controllers: [StaffDiscountsController],
  providers: [StaffDiscountsService],
})
export class StaffDiscountsModule {}
