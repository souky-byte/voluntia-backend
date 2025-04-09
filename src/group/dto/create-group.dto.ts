import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ description: 'Name of the group', maxLength: 255, example: 'Marketing Team' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @ApiPropertyOptional({ description: 'Optional description for the group', example: 'Responsible for marketing campaigns.' })
  @IsOptional()
  @IsString()
  readonly description?: string;
} 