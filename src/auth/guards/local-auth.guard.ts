import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that activates the local authentication strategy.
 * Triggers the `validate` method in LocalStrategy.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Optionally override canActivate or handleRequest if needed
  // For basic usage, inheriting from AuthGuard('local') is sufficient.
} 