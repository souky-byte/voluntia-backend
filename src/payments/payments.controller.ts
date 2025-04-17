import { Body, Controller, Post, UseGuards, Req, HttpCode, HttpStatus, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Stripe Payment Intent and record Contribution' })
  @ApiResponse({ status: 201, description: 'Payment Intent created successfully, returns client_secret.', schema: { example: { clientSecret: 'pi_..._secret_...' } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User not authenticated.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: Request,
  ): Promise<{ clientSecret: string }> {
    const userId = (req as any)?.user?.id;
    if (!userId) {
      this.logger.error('User ID not found after authentication.');
      throw new UnauthorizedException('User information is missing.');
    }
    return this.paymentsService.createPaymentIntent(userId, createPaymentIntentDto.amount);
  }
}
