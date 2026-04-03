import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DebtsModule } from './debts/debts.module';
import { DocumentsModule } from './documents/documents.module';
import { AiModule } from './ai/ai.module';
import { ScoreModule } from './score/score.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    IncomeModule,
    ExpensesModule,
    DebtsModule,
    DocumentsModule,
    AiModule,
    ScoreModule,
    MarketplaceModule,
    GamificationModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
