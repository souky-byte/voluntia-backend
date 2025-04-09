import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileResponseDto } from './dto/response/user-profile-response.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { User } from '../database/entities/user.entity'; // Import User for mapping
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

// Helper function to map User entity to profile response DTO
const mapUserToProfileResponseDto = (user: User): UserProfileResponseDto => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    avatarUrl: user.avatarUrl,
    location: user.location,
    bio: user.bio,
    tags: user.tags,
    created_at: user.createdAt,
    email_verified_at: user.email_verified_at,
    roles: user.roles ? user.roles.map(role => ({ slug: role.slug, name: role.name })) : [],
});

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard) // Apply JWT guard to all routes in this controller
@ApiBearerAuth() // Indicate all routes need Bearer token
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile data', type: UserProfileResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMyProfile(@Request() req: { user: JwtPayload }): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    const user = await this.profileService.getProfile(userId);
    return mapUserToProfileResponseDto(user);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully', type: UserProfileResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async updateMyProfile(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    const updatedUser = await this.profileService.updateProfile(userId, dto);
    return mapUserToProfileResponseDto(updatedUser);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Password changed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data (e.g., passwords mismatch)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Incorrect current password' })
  async changeMyPassword(
    @Request() req: { user: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    const userId = req.user.sub;
    await this.profileService.changePassword(userId, dto);
    // No content returned on success
  }
}
