import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray, IsEmail } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Optional array of emails of users to add as initial members',
    type: [String],
    example: ['member1@example.com', 'member2@example.com']
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true, message: 'Each initial member must be a valid email address' })
  readonly initialMemberEmails?: string[];
} 