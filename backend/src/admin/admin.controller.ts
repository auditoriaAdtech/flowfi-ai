import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tier') tier?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      tier,
    );
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/tier')
  updateUserTier(
    @Param('id') id: string,
    @Body('tier') tier: string,
  ) {
    return this.adminService.updateUserTier(id, tier);
  }

  @Patch('users/:id/status')
  toggleUserStatus(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
  ) {
    if (enabled) {
      return this.adminService.enableUser(id);
    }
    return this.adminService.disableUser(id);
  }

  @Get('revenue')
  getRevenueChart() {
    return this.adminService.getRevenueChart();
  }

  @Get('growth')
  getGrowthMetrics() {
    return this.adminService.getGrowthMetrics();
  }

  @Get('export')
  exportUsers(@Query('format') format?: string) {
    return this.adminService.exportUsers(format || 'json');
  }
}
