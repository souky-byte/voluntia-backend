import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../../database/enums/application-status.enum';

export class ApplicationQueryDto {
  @ApiPropertyOptional({
    enum: ApplicationStatus,
    description: 'Filter applications by status',
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  readonly status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Search term for applicant name or email',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit?: number = 10;

    // Add other potential filters like desiredMembershipType, date range, etc.
} 