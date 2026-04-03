import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ScoreService } from './score.service';

@ApiTags('score')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get()
  async getCurrentScore(@Req() req: any) {
    return this.scoreService.getCurrentScore(req.user.userId);
  }

  @Post('calculate')
  async calculateScore(@Req() req: any) {
    return this.scoreService.calculateScore(req.user.userId);
  }

  @Get('history')
  async getScoreHistory(@Req() req: any) {
    return this.scoreService.getScoreHistory(req.user.userId);
  }
}
