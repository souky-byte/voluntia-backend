import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '../../database/entities/user.entity';

export interface JwtPayload {
  sub: number; // Standard JWT subject claim (user ID)
  email: string;
  roles: string[]; // Array of role slugs
  // Add any other data you want to include in the token payload
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService, // Inject AuthService if you need to re-validate user on each request
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET environment variable not set.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validates the JWT payload.
   * Called automatically by Passport after verifying the token signature and expiration.
   * The return value is attached to the request object as `request.user`.
   * @param payload - The decoded JWT payload.
   * @returns The user object (or just the payload) to attach to the request.
   * @throws UnauthorizedException if validation fails.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Basic validation: Check if user ID exists in payload
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Optional: Re-validate user against the database on each request
    // const user = await this.authService.validateUserById(payload.sub);
    // if (!user) {
    //   throw new UnauthorizedException('User not found or invalid token');
    // }

    // If basic payload validation is sufficient, return the payload
    // This payload will be available as `req.user` in controllers
    return payload;
  }
} 