import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../database/entities/user.entity';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from './strategies/jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles admin login using local strategy.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for admin users', description: 'Authenticates using email and password, returns a JWT token.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many login attempts' })
  async login(@Request() req: { user: Omit<User, 'password'> }, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(req.user as User);
  }

  /**
   * Returns the profile of the currently authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile', description: 'Returns the payload of the authenticated user\'s JWT.' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile data (JWT payload)', type: Object })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized (invalid or missing token)' })
  getProfile(@Request() req: { user: JwtPayload }): JwtPayload {
    return req.user;
  }
}
