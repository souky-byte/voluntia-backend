import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../enums/role-type.enum';

export const ROLES_KEY = 'roles';
/**
 * Decorator to specify which roles are required to access a route.
 * @param roles - An array of RoleType enums.
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles); 