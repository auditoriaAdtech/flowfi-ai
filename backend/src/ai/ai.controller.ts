import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: any, @Body('message') message: string) {
    return this.aiService.chat(req.user.userId, message);
  }

  @Get('insights')
  async getInsights(@Req() req: any) {
    return this.aiService.getInsights(req.user.userId);
  }

  @Get('savings-tips')
  async getSavingsTips(@Req() req: any) {
    return this.aiService.getSavingsRecommendations(req.user.userId);
  }

  @Post('investment-advice')
  async getInvestmentAdvice(
    @Req() req: any,
    @Body('riskProfile') riskProfile: string,
  ) {
    return this.aiService.getInvestmentAdvice(
      req.user.userId,
      riskProfile ?? 'moderate',
    );
  }
}
