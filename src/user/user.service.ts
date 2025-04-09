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
// DTOs would be needed for a UserController, e.g., CreateUserDto, UpdateUserDto

@Injectable()
export class UserService {
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
      select: ['id', 'name', 'email', 'password', 'phone_number', 'email_verified_at', 'created_at', 'updated_at'], // Select all needed fields + password
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

    // Add other methods as needed (updateUser, deleteUser, findUserRoles etc.)

}
