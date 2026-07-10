import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePenaltyDto } from './dto/create-penalty.dto';
import { PenaltiesService } from './penalties.service';

@UseGuards(JwtAuthGuard)
@Controller('penalties')
export class PenaltiesController {
  constructor(private readonly penaltiesService: PenaltiesService) {}

  @Post()
  create(@Body() dto: CreatePenaltyDto) {
    return this.penaltiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.penaltiesService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.penaltiesService.findByEmployee(employeeId);
  }

  @Post(':id/void')
  void(@Param('id', ParseIntPipe) id: number) {
    return this.penaltiesService.void(id);
  }
}
