import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Headers,
  HttpCode,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * POST /payments/create-checkout
   * Creates a Stripe Checkout session and returns the URL.
   * Requires authentication.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create-checkout')
  async createCheckout(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { priceId: string; successUrl?: string; cancelUrl?: string },
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = body.successUrl || `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${frontendUrl}/settings`;

    return this.paymentsService.createCheckoutSession(
      req.user.userId,
      body.priceId,
      successUrl,
      cancelUrl,
    );
  }

  /**
   * POST /payments/customer-portal
   * Creates a Stripe Customer Portal session for managing subscriptions.
   * Requires authentication.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('customer-portal')
  async customerPortal(@Req() req: Request & { user: { userId: string } }) {
    return this.paymentsService.createCustomerPortalSession(req.user.userId);
  }

  /**
   * POST /payments/webhook
   * Stripe webhook endpoint. Does NOT require authentication.
   * Uses the raw body for signature verification.
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // The raw body is needed for Stripe signature verification.
    // Make sure NestFactory.create is called with { rawBody: true }
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available. Ensure rawBody is enabled in NestFactory.');
    }

    await this.paymentsService.handleWebhook(rawBody, signature);
    return { received: true };
  }

  /**
   * GET /payments/status
   * Returns the current subscription status for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('status')
  async getStatus(@Req() req: Request & { user: { userId: string } }) {
    return this.paymentsService.getSubscriptionStatus(req.user.userId);
  }
}
