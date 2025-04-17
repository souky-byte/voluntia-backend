import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';
import { Contribution } from '../database/entities/contribution.entity'; 
import { StripeModule } from '../stripe/stripe.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contribution]), StripeModule, UserModule], 
  controllers: [PaymentsController, WebhookController],
  providers: [
  ],
})
export class PaymentsModule {}
