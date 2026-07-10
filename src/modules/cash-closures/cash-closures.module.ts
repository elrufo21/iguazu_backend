import { Module } from '@nestjs/common';
import { CashClosuresController } from './cash-closures.controller';
import { CashClosuresService } from './cash-closures.service';

@Module({
  controllers: [CashClosuresController],
  providers: [CashClosuresService],
})
export class CashClosuresModule {}
