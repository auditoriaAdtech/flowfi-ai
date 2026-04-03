import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    // Initialize Stripe with secret key from env
    // TODO: Replace with your live secret key in production (sk_live_...)
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
  }

  /**
   * Map tier key to the corresponding Stripe Price ID from env.
   */
  private getPriceIdForTier(tier: string): string {
    const map: Record<string, string | undefined> = {
      STARTER: process.env.STRIPE_STARTER_PRICE_ID,
      PRO: process.env.STRIPE_PRO_PRICE_ID,
      PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
    };
    const priceId = map[tier.toUpperCase()];
    if (!priceId) {
      throw new BadRequestException(`Invalid tier: ${tier}. Must be STARTER, PRO, or PREMIUM.`);
    }
    return priceId;
  }

  /**
   * Get or create a Stripe Customer for the given user.
   */
  private async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Creates a Stripe Checkout session for a subscription.
   * The user will be redirected to Stripe's hosted checkout page.
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    const customerId = await this.getOrCreateCustomer(userId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    return { sessionId: session.id, url: session.url! };
  }

  /**
   * Creates a Stripe Customer Portal session so users can manage
   * their subscription (cancel, change payment method, etc.).
   */
  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No active subscription found. Please subscribe first.');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings`,
    });

    return { url: session.url };
  }

  /**
   * Handles incoming Stripe webhooks.
   * Verifies the signature and processes relevant events.
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      // TODO: Replace with your live webhook secret in production (whsec_...)
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here',
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Called when a Checkout session completes successfully.
   * Links the subscription to the user.
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('Checkout session missing userId metadata');
      return;
    }

    const subscriptionId = session.subscription as string;
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        subscriptionStatus: 'active',
        subscriptionTier: this.mapPriceToTier(priceId),
      },
    });

    this.logger.log(`User ${userId} subscribed with price ${priceId}`);
  }

  /**
   * Called when a subscription is updated (e.g. plan change, renewal).
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) {
      this.logger.warn(`No user found for Stripe customer ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const status = subscription.status; // active, past_due, canceled, etc.

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        subscriptionStatus: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'canceled',
        subscriptionTier: status === 'active' ? this.mapPriceToTier(priceId) : 'FREE',
      },
    });

    this.logger.log(`Subscription updated for user ${user.id}: status=${status}, price=${priceId}`);
  }

  /**
   * Called when a subscription is deleted/canceled.
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) {
      this.logger.warn(`No user found for Stripe customer ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionTier: 'FREE',
        stripePriceId: null,
        stripeSubscriptionId: null,
      },
    });

    this.logger.log(`Subscription canceled for user ${user.id}`);
  }

  /**
   * Maps a Stripe Price ID to the internal subscription tier enum.
   * TODO: Update these to match your actual Stripe Price IDs in production.
   */
  private mapPriceToTier(priceId?: string): 'FREE' | 'BASIC' | 'PRO' {
    if (!priceId) return 'FREE';

    const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly';
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly';
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly';

    // Map Stripe prices to the existing Prisma SubscriptionTier enum.
    // The current schema has FREE, BASIC, PRO.
    // STARTER -> BASIC, PRO -> PRO, PREMIUM -> PRO (highest available)
    // TODO: Consider adding STARTER and PREMIUM to the SubscriptionTier enum
    if (priceId === starterPriceId) return 'BASIC';
    if (priceId === proPriceId) return 'PRO';
    if (priceId === premiumPriceId) return 'PRO';
    return 'FREE';
  }

  /**
   * Returns the current subscription status for a user.
   */
  async getSubscriptionStatus(userId: string): Promise<{
    tier: string;
    status: string;
    priceId: string | null;
    subscriptionId: string | null;
    customerId: string | null;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus || 'inactive',
      priceId: user.stripePriceId || null,
      subscriptionId: user.stripeSubscriptionId || null,
      customerId: user.stripeCustomerId || null,
    };
  }
}
