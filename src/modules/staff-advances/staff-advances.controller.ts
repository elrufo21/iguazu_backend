import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStaffAdvanceDto } from './dto/create-staff-advance.dto';
import { StaffAdvancesService } from './staff-advances.service';

@UseGuards(JwtAuthGuard)
@Controller('staff-advances')
export class StaffAdvancesController {
  constructor(private readonly staffAdvancesService: StaffAdvancesService) {}

  @Post()
  create(@Body() dto: CreateStaffAdvanceDto, @CurrentUser() user: any) {
    return this.staffAdvancesService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.staffAdvancesService.findAll();
  }
}
