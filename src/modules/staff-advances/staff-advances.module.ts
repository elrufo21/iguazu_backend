import { Module } from '@nestjs/common';
import { CashMovementsModule } from '../cash-movements/cash-movements.module';
import { StaffAdvancesController } from './staff-advances.controller';
import { StaffAdvancesService } from './staff-advances.service';

@Module({
  imports: [CashMovementsModule],
  controllers: [StaffAdvancesController],
  providers: [StaffAdvancesService],
})
export class StaffAdvancesModule {}
