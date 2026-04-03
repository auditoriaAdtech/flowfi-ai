import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { IncomeService } from './income.service';
import { Request } from 'express';
import { IncomeType } from '@prisma/client';

@ApiTags('income')
@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.incomeService.create(userId, body);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('type') type?: IncomeType,
  ) {
    const userId = (req as any).user.userId;
    return this.incomeService.findAll(userId, {
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      type,
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.incomeService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.incomeService.update(userId, id, body);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.incomeService.delete(userId, id);
  }
}
