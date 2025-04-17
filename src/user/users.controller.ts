import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service'; // Correct path
import { UserQueryDto } from './dto/admin/user-query.dto';
import { PaginatedUsersResponseDto } from './dto/admin/response/paginated-users-response.dto';
import { UserAdminViewDto } from './dto/admin/response/user-admin-view.dto';
import { UserBasicViewDto } from './dto/admin/response/user-basic-view.dto'; // Import basic DTO
import { PaginatedUsersBasicResponseDto } from './dto/admin/response/paginated-users-basic-response.dto'; // Import basic paginated DTO
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct path
import { RolesGuard } from '../auth/guards/roles.guard'; // Correct path
import { Roles } from '../auth/decorators/roles.decorator'; // Correct path
import { RoleType } from '../auth/enums/role-type.enum'; // Correct path
import { User } from '../database/entities/user.entity'; // Import User for mapping
import { JwtPayload } from 'jsonwebtoken';

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

// Helper function to map User entity to BASIC DTO
const mapUserToBasicViewDto = (user: User): UserBasicViewDto => ({
    id: user.id,
    name: user.name,
    email: user.email,
});

@ApiTags('Users') // Update tag
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Keep guards
@Controller('users') // Update path
export class UsersController { // Update class name
  constructor(private readonly userService: UserService) {}

  @Get()
  // Allow more roles
  @Roles(RoleType.ADMIN, RoleType.MEMBER, RoleType.SUPPORTER)
  @ApiOperation({ summary: 'Get list of users', description: 'Retrieves users with filtering by role and pagination. Response detail depends on user role.' })
  @ApiQuery({ name: 'roleSlug', required: false, enum: RoleType, description: 'Filter by user role slug' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for user name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10, maximum: 100 })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Paginated list of users (detail depends on role)',
      schema: {
          oneOf: [
              { $ref: '#/components/schemas/PaginatedUsersResponseDto' },
              { $ref: '#/components/schemas/PaginatedUsersBasicResponseDto' },
          ],
      }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (Requires Admin, Member, or Supporter role)' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error retrieving users' })
  async findUsers(
      @Request() req: { user: JwtPayload },
      @Query() queryDto: UserQueryDto
  ): Promise<PaginatedUsersResponseDto | PaginatedUsersBasicResponseDto> { // Return union type
    const result = await this.userService.findUsersByRole(queryDto);

    // Check the role of the requesting user
    const requestingUserRoles = req.user.roles;
    const isAdmin = requestingUserRoles.includes(RoleType.ADMIN);

    // Map data based on the role
    const mappedData = isAdmin
        ? result.data.map(mapUserToAdminViewDto)
        : result.data.map(mapUserToBasicViewDto);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: mappedData,
    };
  }

  // Other admin endpoints like GET /users/:id, PUT, DELETE would need
  // to remain ADMIN only or have similar role-based logic applied if needed by others.
}
