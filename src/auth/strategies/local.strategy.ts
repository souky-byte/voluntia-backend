import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Use email as the username field
      // passwordField: 'password' // default is 'password'
    });
  }

  /**
   * Validates user credentials.
   * Called automatically by Passport during the local authentication flow.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns The validated user object if credentials are valid.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async validate(email: string, passwordInput: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.authService.validateUser(email, passwordInput);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return user object without the password
    const { password, ...result } = user;
    return result;
  }
} 