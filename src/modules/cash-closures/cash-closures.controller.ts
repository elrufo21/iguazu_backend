import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashClosuresService } from './cash-closures.service';
import { CloseCashShiftDto } from './dto/close-cash-shift.dto';
import { CorrectCashClosureDto } from './dto/correct-cash-closure.dto';
import { SettleDifferenceDto } from './dto/settle-difference.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash-closures')
export class CashClosuresController {
  constructor(private readonly cashClosuresService: CashClosuresService) {}

  @Post('close')
  close(@Body() dto: CloseCashShiftDto, @CurrentUser() user: any) {
    return this.cashClosuresService.close(dto, user.sub);
  }

  @Get('preview')
  preview(@CurrentUser() user: any) {
    return this.cashClosuresService.preview(user.sub);
  }

  @Get()
  findAll() {
    return this.cashClosuresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashClosuresService.findOne(id);
  }

  @Post(':id/reopen')
  reopen(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.cashClosuresService.reopen(id, user);
  }

  @Patch(':id/counts')
  correctCounts(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectCashClosureDto,
    @CurrentUser() user: any,
  ) {
    return this.cashClosuresService.correctCounts(id, dto, user);
  }

  @Post(':id/settle')
  settle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SettleDifferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.cashClosuresService.settleDifference(id, dto, user);
  }
}
