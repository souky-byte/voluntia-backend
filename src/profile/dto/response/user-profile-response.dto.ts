import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { Role } from '../../../database/entities/role.entity'; // Old path
import { Role } from '@database/entities/role.entity'; // Use alias

// Re-use RoleDto from UserAdminViewDto or define separately
class RoleDto {
    @ApiProperty({ example: 'member' })
    slug: string;
    @ApiProperty({ example: 'Party Member' })
    name: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe Updated' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+420123456789' })
  phone_number: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ example: 'Prague, Czech Republic' })
  location: string | null;

  @ApiPropertyOptional({ example: 'Passionate developer...' })
  bio: string | null;

  @ApiPropertyOptional({ type: [String], example: ['nestjs', 'typescript'] })
  tags: string[] | null;

  @ApiPropertyOptional({ type: [RoleDto], description: 'Roles assigned to the user' })
  roles: RoleDto[];

  @ApiProperty({ example: '2024-04-09T10:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ example: '2024-04-09T10:30:00.000Z' })
  email_verified_at: Date | null;
} 