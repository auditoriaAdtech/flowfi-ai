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
import { DebtsService } from './debts.service';
import { Request } from 'express';
import { DebtStrategy } from '@prisma/client';

@ApiTags('debts')
@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.debtsService.create(userId, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.debtsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.debtsService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.debtsService.update(userId, id, body);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.debtsService.delete(userId, id);
  }

  @Post(':id/payments')
  addPayment(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.debtsService.addPayment(userId, id, body);
  }

  @Get(':id/plan')
  getPaymentPlan(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('strategy') strategy?: DebtStrategy,
  ) {
    const userId = (req as any).user.userId;
    return this.debtsService.getPaymentPlan(
      userId,
      id,
      strategy ?? 'SNOWBALL',
    );
  }
}
