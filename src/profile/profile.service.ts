import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserService) {}

  async getProfile(userId: number): Promise<User> {
    // findOneById already throws NotFoundException if user doesn't exist
    return this.userService.findOneById(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId); // Reuse getProfile to ensure user exists

    // Update only the fields provided in the DTO
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.location !== undefined) user.location = dto.location;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.tags !== undefined) user.tags = dto.tags;

    try {
        // Assuming UserService has a general save method or use repository directly if needed
        // For simplicity, let's assume we add a save method to UserService
        return await this.userService.saveUser(user);
    } catch (error) {
        // Add proper logging
        throw new InternalServerErrorException('Failed to update profile.');
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userService.findOneByIdWithPassword(userId);

    if (!user) {
      // Should not happen if user is authenticated, but good for robustness
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!user.password) {
        // User might have been created without a password (e.g., initial application)
        throw new UnauthorizedException('Cannot change password, no current password set.');
    }

    const isPasswordMatching = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Incorrect current password');
    }

    // DTO validation already ensures newPassword and confirmPassword match
    user.password = dto.newPassword; // Hook in User entity will hash it

    try {
        await this.userService.saveUser(user); // Use the same save method
    } catch (error) {
        // Add proper logging
        throw new InternalServerErrorException('Failed to change password.');
    }
  }
}
