import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    return this.analyticsService.getDashboardData(req.user.userId);
  }

  @Get('report/:year/:month')
  async getMonthlyReport(
    @Req() req: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.analyticsService.getMonthlyReport(
      req.user.userId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  @Get('projection')
  async getCashFlowProjection(
    @Req() req: any,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getCashFlowProjection(
      req.user.userId,
      months ? parseInt(months, 10) : 6,
    );
  }
}
