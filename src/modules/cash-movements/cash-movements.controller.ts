import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReverseCashMovementDto } from './dto/reverse-cash-movement.dto';
import { CashMovementsService } from './cash-movements.service';

@UseGuards(JwtAuthGuard)
@Controller('cash-movements')
export class CashMovementsController {
  constructor(private readonly cashMovementsService: CashMovementsService) {}

  @Get()
  findAll() {
    return this.cashMovementsService.findAll();
  }

  @Get('by-shift/:cashShiftId')
  byShift(@Param('cashShiftId', ParseIntPipe) cashShiftId: number) {
    return this.cashMovementsService.byShift(cashShiftId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashMovementsService.findOne(id);
  }

  @Post(':id/reverse')
  reverse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReverseCashMovementDto,
    @CurrentUser() user: any,
  ) {
    return this.cashMovementsService.reverse(id, dto.reason, user.sub);
  }
}
