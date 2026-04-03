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
import { ExpensesService } from './expenses.service';
import { Request } from 'express';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.expensesService.create(userId, body);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') category?: string,
  ) {
    const userId = (req as any).user.userId;
    return this.expensesService.findAll(userId, {
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      category,
    });
  }

  @Get('subscriptions')
  getSubscriptions(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.expensesService.detectSubscriptions(userId);
  }

  @Get('by-category')
  getByCategory(
    @Req() req: Request,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const userId = (req as any).user.userId;
    return this.expensesService.getByCategory(
      userId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.expensesService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req as any).user.userId;
    return this.expensesService.update(userId, id, body);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    return this.expensesService.delete(userId, id);
  }
}
