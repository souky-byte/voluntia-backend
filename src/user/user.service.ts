import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RoleType } from '../auth/enums/role-type.enum';
import * as bcrypt from 'bcrypt';
import { UserQueryDto } from './dto/admin/user-query.dto';
import { Logger } from '@nestjs/common';

// Structure for paginated user results (can be moved to a shared location)
export interface PaginatedUsersResult {
    data: User[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Finds a user by email, including their password.
   * Used primarily for authentication.
   * @param email - The user's email.
   * @returns The user entity with password or null if not found.
   */
  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    // Use addSelect to explicitly include the password field
    return this.userRepository.findOne({
      where: { email },
      // Select properties, TypeORM handles mapping to columns
      select: ['id', 'name', 'email', 'password', 'phone_number', 'email_verified_at', 'createdAt', 'updatedAt'],
      relations: ['roles'], // Ensure roles are loaded
    });
  }

  /**
   * Finds a user by email (without password).
   * @param email - The user's email.
   * @returns The user entity or null if not found.
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['roles'] });
  }

  /**
   * Finds a user by ID.
   * @param id - The user's ID.
   * @returns The user entity.
   * @throws NotFoundException if user not found.
   */
  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Finds a user by ID, including their password.
   * @param id - The user's ID.
   * @returns The user entity with password or null if not found.
   */
  async findOneByIdWithPassword(id: number): Promise<User | null> {
    // Use query builder to select password explicitly
    return this.userRepository.createQueryBuilder('user')
        .addSelect('user.password') // Select the password field
        .leftJoinAndSelect('user.roles', 'role')
        .where('user.id = :id', { id })
        .getOne(); // Use getOne() instead of findOne for query builder
  }

  /**
   * Creates a new user (typically used internally or by admin).
   * Requires a DTO for input validation if exposed via controller.
   * @param userData - Object containing user data (name, email, optionally password, phone_number).
   * @returns The newly created user entity.
   * @throws ConflictException if email already exists.
   */
  async createUser(userData: Partial<User>): Promise<User> {
    if (!userData.email) {
      throw new InternalServerErrorException('Email is required to create a user');
    }
    const existingUser = await this.findOneByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const newUser = this.userRepository.create(userData);
    // Note: Password hashing happens automatically via @BeforeInsert hook in User entity
    try {
      return await this.userRepository.save(newUser);
    } catch (error) {
      // Handle potential database errors (e.g., unique constraint violation if check failed)
      throw new InternalServerErrorException('Could not create user');
    }
  }

  /**
   * Assigns a specific role to a user.
   * @param userId - The ID of the user.
   * @param roleType - The slug of the role to assign.
   * @returns The updated user entity.
   * @throws NotFoundException if user or role not found.
   */
  async assignRole(userId: number, roleType: RoleType): Promise<User> {
    const user = await this.findOneById(userId); // Throws NotFoundException if user doesn't exist

    const role = await this.roleRepository.findOneBy({ slug: roleType });
    if (!role) {
      throw new NotFoundException(`Role with slug "${roleType}" not found`);
    }

    // Add role if not already present
    if (!user.roles.some(r => r.id === role.id)) {
      user.roles.push(role);
      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Sets or updates the password for a user.
   * @param userId - The ID of the user.
   * @param password - The new plain text password.
   * @returns The updated user entity.
   * @throws NotFoundException if user not found.
   */
  async setUserPassword(userId: number, password: string): Promise<User> {
    const user = await this.findOneById(userId); // Throws NotFoundException if user doesn't exist
    // Password will be hashed automatically by the @BeforeUpdate hook in the User entity
    user.password = password;
    return this.userRepository.save(user);
  }

  /**
   * Saves a user entity.
   * Can be used after modifying a user object.
   * @param user - The user entity to save.
   * @returns The saved user entity.
   */
  async saveUser(user: User): Promise<User> {
    try {
        return await this.userRepository.save(user);
    } catch (error) {
        // Add proper logging
        throw new InternalServerErrorException('Failed to save user data.');
    }
  }

  /**
   * Finds users with filtering by role slug and pagination.
   * @param queryDto - DTO containing filter and pagination options.
   * @returns Paginated list of users.
   */
  async findUsersByRole(queryDto: UserQueryDto): Promise<PaginatedUsersResult> {
    const { roleSlug, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role') // Join roles
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (roleSlug) {
      queryBuilder.andWhere('role.slug = :roleSlug', { roleSlug });
    }

    if (search) {
      queryBuilder.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    try {
      const [users, total] = await queryBuilder.getManyAndCount();
      return {
        data: users,
        total: total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve users. QueryDto: ${JSON.stringify(queryDto)}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve users.');
    }
  }

    // Add other methods as needed (updateUser, deleteUser, findUserRoles etc.)

}
