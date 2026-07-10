import { Module } from '@nestjs/common';
import { RoomTypePricesController } from './room-type-prices.controller';
import { RoomTypePricesService } from './room-type-prices.service';

@Module({
  controllers: [RoomTypePricesController],
  providers: [RoomTypePricesService],
})
export class RoomTypePricesModule {}
