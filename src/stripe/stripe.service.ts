import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  // Inject the configured Stripe client instance
  constructor(private readonly stripe: Stripe) {}

  /**
   * Creates a Stripe PaymentIntent.
   * @param amount Amount in the smallest currency unit (e.g., cents for EUR).
   * @param currency Currency code (e.g., 'eur').
   * @param metadata Optional metadata to attach to the PaymentIntent.
   * @returns The created Stripe PaymentIntent object.
   */
  async createPaymentIntent(
    amount: number,
    currency = 'eur',
    metadata?: Stripe.MetadataParam,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Creating PaymentIntent for amount: ${amount} ${currency}`);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        // Add payment method types if needed, e.g., ['card']
        // automatic_payment_methods: { enabled: true }, // Consider enabling automatic methods
        metadata, // Include user ID, order ID, etc.
      });
      this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create PaymentIntent: ${error.message}`, error.stack);
      // Re-throw or handle specific Stripe errors appropriately
      throw error;
    }
  }

  /**
   * Constructs and verifies a Stripe webhook event.
   * @param payload The raw request body.
   * @param signature The 'stripe-signature' header.
   * @param endpointSecret The webhook signing secret.
   * @returns The verified Stripe event.
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
    endpointSecret: string,
  ): Stripe.Event {
    this.logger.log('Constructing webhook event...');
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
      this.logger.log(`Webhook event constructed successfully: ${event.id}, Type: ${event.type}`);
      return event;
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      // Throwing an error here will typically result in a 400 response
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
