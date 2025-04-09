import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { Role } from '../../../database/entities/role.entity'; // Old relative path
import { Role } from '@database/entities/role.entity'; // Use path alias

// Simplified Role DTO for embedding
class RoleDto {
    @ApiProperty({ example: 'member' })
    slug: string;
    @ApiProperty({ example: 'Party Member' })
    name: string;
}

export class UserAdminViewDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+420123456789' })
  phone_number: string | null;

  @ApiPropertyOptional({ type: [RoleDto], description: 'Roles assigned to the user' })
  roles: RoleDto[];

  @ApiProperty({ example: '2024-04-09T10:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ example: '2024-04-09T10:30:00.000Z' })
  email_verified_at: Date | null;

  // Add other relevant fields for admin view if needed
} 