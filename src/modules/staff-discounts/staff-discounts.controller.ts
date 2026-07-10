import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStaffDiscountDto } from './dto/create-staff-discount.dto';
import { StaffDiscountsService } from './staff-discounts.service';

@UseGuards(JwtAuthGuard)
@Controller('staff-discounts')
export class StaffDiscountsController {
  constructor(private readonly staffDiscountsService: StaffDiscountsService) {}

  @Post()
  create(@Body() dto: CreateStaffDiscountDto, @CurrentUser() user: any) {
    return this.staffDiscountsService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.staffDiscountsService.findAll();
  }
}
