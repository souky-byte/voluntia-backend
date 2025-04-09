import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DecisionDto {
  @ApiPropertyOptional({
    description: 'Optional notes regarding the decision (approval/decline)',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  readonly decisionNotes?: string;
} 