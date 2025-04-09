import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Explicitly list assignable role slugs or fetch dynamically if needed
const assignableGroupRoles = ['leader', 'member'];

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'Slug of the new role to assign to the member',
    example: 'member',
    enum: assignableGroupRoles, // Helps Swagger UI
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(assignableGroupRoles, { message: `Role slug must be one of: ${assignableGroupRoles.join(', ')}` })
  readonly roleSlug: string;
} 