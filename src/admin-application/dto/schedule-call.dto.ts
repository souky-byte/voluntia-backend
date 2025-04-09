import { IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleCallDto {
  @ApiProperty({
    example: '2024-12-31T14:30:00Z',
    description: 'Date and time when the call is scheduled (ISO 8601 format)',
  })
  @IsNotEmpty()
  @IsDateString()
  readonly callScheduledAt: string;
} 