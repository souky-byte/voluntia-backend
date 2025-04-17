import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StripeService,
      useFactory: (configService: ConfigService): StripeService => {
        const apiKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!apiKey) {
          throw new Error('Stripe secret key not configured in environment variables.');
        }
        // Correctly instantiate Stripe client and then the service
        const stripeClient = new Stripe(apiKey, {
          // apiVersion: '2024-04-10', // Removed: Let Stripe library use its default
          // Add other Stripe configurations if needed
        });
        return new StripeService(stripeClient); // Corrected: Pass only client to service constructor
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeService],
})
export class StripeModule {}
