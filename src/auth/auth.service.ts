import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials for local strategy.
   * @param email - User's email.
   * @param pass - Plain text password.
   * @returns The user object if valid, otherwise null.
   */
  async validateUser(email: string, pass: string): Promise<User | null> {
    // Find user by email, including the password field
    const user = await this.userService.findOneByEmailWithPassword(email);

    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      // Password matches, return user (password will be stripped later)
      return user;
    }
    return null; // Invalid credentials
  }

  /**
   * Generates a JWT for a given user.
   * @param user - The user object.
   * @returns An object containing the access token.
   */
  async login(user: User): Promise<{ access_token: string }> {
    // Ensure roles are loaded (if not eager loaded)
    // const roles = user.roles || await this.userService.findUserRoles(user.id);
    const roles = user.roles.map(role => role.slug); // Use slugs for payload

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      roles: roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Optional: Add method to validate user by ID if needed for JwtStrategy
  // async validateUserById(userId: number): Promise<User | null> {
  //   return this.userService.findOneById(userId);
  // }
}
