import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreService } from '../score/score.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreService: ScoreService,
  ) {}

  async findAll() {
    return this.prisma.marketplaceOffer.findMany({
      where: { active: true },
      orderBy: { minScore: 'asc' },
    });
  }

  async findOne(id: string) {
    const offer = await this.prisma.marketplaceOffer.findUnique({
      where: { id },
    });
    if (!offer) {
      throw new NotFoundException('Marketplace offer not found');
    }
    return offer;
  }

  async getEligibleOffers(userId: string) {
    const scoreData = await this.scoreService.getCurrentScore(userId);
    const userScore = scoreData.score;

    const offers = await this.prisma.marketplaceOffer.findMany({
      where: {
        active: true,
        minScore: { lte: userScore },
      },
      orderBy: { minScore: 'desc' },
    });

    return {
      userScore,
      eligibleCount: offers.length,
      offers: offers.map((offer) => ({
        ...offer,
        matchPercentage: Math.min(
          100,
          Math.round((userScore / offer.minScore) * 100),
        ),
      })),
    };
  }
}
