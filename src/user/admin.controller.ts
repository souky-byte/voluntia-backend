import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service'; // Correct path
import { UserQueryDto } from './dto/admin/user-query.dto';
import { PaginatedUsersResponseDto } from './dto/admin/response/paginated-users-response.dto';
import { UserAdminViewDto } from './dto/admin/response/user-admin-view.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct path
import { RolesGuard } from '../auth/guards/roles.guard'; // Correct path
import { Roles } from '../auth/decorators/roles.decorator'; // Correct path
import { RoleType } from '../auth/enums/role-type.enum'; // Correct path
import { User } from '../database/entities/user.entity'; // Import User for mapping

// Helper function to map User entity to DTO
const mapUserToAdminViewDto = (user: User): UserAdminViewDto => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    created_at: user.createdAt,
    email_verified_at: user.email_verified_at,
    roles: user.roles ? user.roles.map(role => ({ slug: role.slug, name: role.name })) : [],
    // Map other fields as needed
});

@ApiTags('Users (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@Controller('admin/users') // Set base route to /admin/users
export class AdminController { // Rename if needed, e.g., UserAdminController
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of users (admin)', description: 'Retrieves users with filtering by role and pagination.' })
  @ApiQuery({ name: 'roleSlug', required: false, enum: RoleType, description: 'Filter by user role slug' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for user name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10, maximum: 100 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of users', type: PaginatedUsersResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error retrieving users' })
  async findUsers(@Query() queryDto: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const result = await this.userService.findUsersByRole(queryDto);
    return {
      ...result,
      data: result.data.map(mapUserToAdminViewDto),
    };
  }

  // Add other admin user endpoints here if needed (e.g., GET /admin/users/:id, PUT ..., DELETE ...)
}
