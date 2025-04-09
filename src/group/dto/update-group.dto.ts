import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: 'New name for the group', maxLength: 255, example: 'Digital Marketing Team' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly name?: string;

  @ApiPropertyOptional({ description: 'New description for the group', example: 'Focusing on online presence.' })
  @IsOptional()
  @IsString()
  readonly description?: string;
} 