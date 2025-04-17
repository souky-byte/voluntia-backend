import { Controller, Post, Req, Res, Headers, Logger, RawBodyRequest, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';

@ApiExcludeController()
@Controller('stripe-webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.error('Raw body not available for webhook processing.');
      throw new HttpException('Webhook configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!signature) {
      this.logger.warn('Missing stripe-signature header');
      throw new HttpException('Missing stripe-signature header', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.paymentsService.handleWebhook(req.rawBody, signature);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      this.logger.error(`Webhook processing error: ${err.message}`);
      throw new HttpException('Webhook Error', HttpStatus.BAD_REQUEST);
    }
  }
}
