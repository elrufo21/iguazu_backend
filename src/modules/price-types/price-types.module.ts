import { Module } from '@nestjs/common';
import { PriceTypesController } from './price-types.controller';
import { PriceTypesService } from './price-types.service';

@Module({
  controllers: [PriceTypesController],
  providers: [PriceTypesService],
})
export class PriceTypesModule {}
