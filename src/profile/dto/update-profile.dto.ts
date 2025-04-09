import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: "User's full name", maxLength: 255, example: 'John Doe Updated' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "URL of the user's avatar image",
    maxLength: 512,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl(undefined, { message: 'Avatar URL must be a valid URL' })
  @MaxLength(512)
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "User's location (e.g., city, country)",
    maxLength: 255,
    example: 'Prague, Czech Republic',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Short user biography', example: 'Passionate developer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Array of user tags/interests (max 10)',
    type: [String],
    example: ['nestjs', 'typescript', 'politics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];
} 