import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../../auth/enums/role-type.enum'; // Import RoleType enum

export class UserQueryDto {
  @ApiPropertyOptional({
    enum: RoleType,
    description: 'Filter users by role slug (e.g., member, supporter)',
    example: RoleType.MEMBER,
  })
  @IsOptional()
  @IsEnum(RoleType)
  readonly roleSlug?: RoleType;

  @ApiPropertyOptional({
    description: 'Search term for user name or email',
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
} 