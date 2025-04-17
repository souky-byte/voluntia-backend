import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount intended to be collected in the smallest currency unit (e.g., cents for EUR).',
    example: 1000, // e.g., 10 EUR
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(50) // Stripe minimum charge amount might vary per currency (e.g., 0.50 EUR)
  amount: number;

  // You could add currency here if you support multiple currencies
  // @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'eur', default: 'eur' })
  // @IsString()
  // @IsOptional()
  // currency?: string = 'eur';

  // Add other relevant data like user ID or order ID if needed
  // @ApiPropertyOptional({ description: 'Associated user ID' })
  // @IsString()
  // @IsOptional()
  // userId?: string;
}
