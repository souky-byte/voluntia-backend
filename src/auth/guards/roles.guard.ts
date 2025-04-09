import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleType } from '../enums/role-type.enum';
import { JwtPayload } from '../strategies/jwt.strategy'; // Import JwtPayload

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get the required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user object attached by JwtAuthGuard (which contains the JWT payload)
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload; // Cast to JwtPayload

    // Check if user object exists and has roles
    if (!user || !user.roles) {
       throw new ForbiddenException('User roles not found in token or user not authenticated properly.');
    }

    // Check if the user has at least one of the required roles
    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
} 