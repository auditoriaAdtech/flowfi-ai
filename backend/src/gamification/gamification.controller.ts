import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('achievements')
  async getAchievements(@Req() req: any) {
    return this.gamificationService.getUserAchievements(req.user.userId);
  }

  @Get('level')
  async getLevel(@Req() req: any) {
    return this.gamificationService.getUserLevel(req.user.userId);
  }

  @Post('check')
  async checkAchievements(@Req() req: any) {
    return this.gamificationService.checkAndAwardAchievements(req.user.userId);
  }
}
