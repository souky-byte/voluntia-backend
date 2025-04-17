import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { Contribution, ContributionStatus } from '../database/entities/contribution.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
    if (!this.webhookSecret) {
      this.logger.error('FATAL: STRIPE_WEBHOOK_SECRET is not set.');
      throw new Error('Stripe webhook secret is not configured.');
    }
  }

  async createPaymentIntent(
    userId: number,
    amount: number,
  ): Promise<{ clientSecret: string }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      this.logger.error(`User ${userId} not found.`);
      throw new UnauthorizedException('Authenticated user not found.');
    }

    const contribution = this.contributionRepository.create({
      user,
      amount,
      currency: 'eur',
      status: ContributionStatus.PENDING,
      stripePaymentIntentId: null,
    });
    await this.contributionRepository.save(contribution);
    this.logger.log(`Created contribution ${contribution.id} (PENDING)`);

    const metadata: Stripe.MetadataParam = {
      userId: userId.toString(),
      contributionId: contribution.id.toString(),
    };
    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      'eur',
      metadata,
    );

    if (!paymentIntent.client_secret) {
      this.logger.error(`Missing client_secret for PaymentIntent ${paymentIntent.id}`);
      throw new InternalServerErrorException('Failed to create payment intent.');
    }

    contribution.stripePaymentIntentId = paymentIntent.id;
    await this.contributionRepository.save(contribution);
    this.logger.log(`Updated contribution ${contribution.id} with PaymentIntent ID ${paymentIntent.id}`);

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook verification failed: ${err.message}`);
      throw err;
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const metadataId = pi.metadata?.contributionId;
    let contribution: Contribution | null = null;
    if (metadataId) {
      contribution = await this.contributionRepository.findOneBy({ id: parseInt(metadataId, 10) });
    }
    if (!contribution) {
      contribution = await this.contributionRepository.findOneBy({ stripePaymentIntentId: pi.id });
    }
    if (!contribution) {
      this.logger.warn(`Contribution not found for PaymentIntent ${pi.id}.`);
      return;
    }
    // Process event type
    if (event.type === 'payment_intent.succeeded') {
      if (contribution.status === ContributionStatus.PENDING) {
        contribution.status = ContributionStatus.SUCCEEDED;
        await this.contributionRepository.save(contribution);
        this.logger.log(`Contribution ${contribution.id} SUCCEEDED`);
      } else {
        this.logger.warn(`Contribution ${contribution.id} already in status ${contribution.status}.`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      if (contribution.status === ContributionStatus.PENDING) {
        contribution.status = ContributionStatus.FAILED;
        await this.contributionRepository.save(contribution);
        this.logger.log(`Contribution ${contribution.id} FAILED`);
      } else {
        this.logger.warn(`Contribution ${contribution.id} already in status ${contribution.status}.`);
      }
    } else {
      this.logger.log(`Unhandled event type: ${event.type}`);
    }
    return;
  }
}
