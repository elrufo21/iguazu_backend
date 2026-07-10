import { Module } from '@nestjs/common';
import { CashMovementsModule } from '../cash-movements/cash-movements.module';
import { StaysModule } from '../stays/stays.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [CashMovementsModule, StaysModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
