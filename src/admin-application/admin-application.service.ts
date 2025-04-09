import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { Application } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { ApplicationStatus } from '../database/enums/application-status.enum';
import { MembershipType } from '../database/enums/membership-type.enum';
import { RoleType } from '../auth/enums/role-type.enum';
import { UserService } from '../user/user.service';
import { MailerService } from '../shared/services/mailer.service';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { ScheduleCallDto } from './dto/schedule-call.dto';
import { DecisionDto } from './dto/decision.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../database/entities/role.entity';

// Define a structure for paginated results
export interface PaginatedApplicationsResult {
  data: Application[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AdminApplicationService {
  private readonly logger = new Logger(AdminApplicationService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly userService: UserService,
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Finds all applications with filtering and pagination.
   * @param queryDto - DTO containing filter and pagination options.
   * @returns Paginated list of applications.
   */
  async findAll(queryDto: ApplicationQueryDto): Promise<PaginatedApplicationsResult> {
    const { status, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder: SelectQueryBuilder<Application> = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.processedByAdmin', 'admin')
      .orderBy('application.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    try {
      const [applications, total] = await queryBuilder.getManyAndCount();
      return {
        data: applications,
        total: total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve applications', error.stack);
      throw new InternalServerErrorException('Failed to retrieve applications.');
    }
  }

  /**
   * Finds a single application by ID, including related user.
   * @param id - The application ID.
   * @returns The application entity.
   * @throws NotFoundException if application not found.
   */
  async findOne(id: number): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['user', 'processedByAdmin'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  /**
   * Updates application status to 'call_scheduled'.
   * @param id - Application ID.
   * @param scheduleCallDto - DTO with scheduled time.
   * @param adminUserPayload - JWT payload of the admin performing the action.
   * @returns The updated application entity.
   */
  async scheduleCall(
    id: number,
    scheduleCallDto: ScheduleCallDto,
    adminUserPayload: JwtPayload,
  ): Promise<Application> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const application = await queryRunner.manager.findOne(Application, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException(
          `Cannot schedule call for application with status: ${application.status}`,
        );
      }

      application.status = ApplicationStatus.CALL_SCHEDULED;
      application.callScheduledAt = new Date(scheduleCallDto.callScheduledAt);
      application.processedByAdminId = adminUserPayload.sub;

      const savedApplication = await queryRunner.manager.save(Application, application);

      await queryRunner.commitTransaction();

      this.logger.log(`Application ID ${id} call scheduled by admin ${adminUserPayload.sub}`);
      return savedApplication;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to schedule call for application ID: ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to schedule call.');
    } finally {
      await queryRunner.release();
    }
  }

  async approveApplication(
    id: number,
    decisionDto: DecisionDto,
    adminUserPayload: JwtPayload,
  ): Promise<Application> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find and lock application first
      const application = await queryRunner.manager.findOne(Application, {
        where: { id },
        // relations: ['user'], // Remove relation loading here
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }

      // Now load the user separately within the transaction
      const user = await queryRunner.manager.findOneBy(User, { id: application.userId });
      if (!user) {
        // This case should ideally not happen due to DB constraints, but good to check
        throw new InternalServerErrorException(`User with ID ${application.userId} linked to application ${id} not found!`);
      }
      application.user = user; // Manually attach the loaded user for later use (e.g., email)

      if (application.status === ApplicationStatus.APPROVED || application.status === ApplicationStatus.DECLINED) {
        throw new BadRequestException(`Application has already been processed (Status: ${application.status})`);
      }

      // Map MembershipType to RoleType
      const roleMap: Record<MembershipType, RoleType> = {
        [MembershipType.COMMUNITY]: RoleType.COMMUNITY,
        [MembershipType.SUPPORTER]: RoleType.SUPPORTER,
        [MembershipType.MEMBER]: RoleType.MEMBER,
      };
      const roleToAssignSlug = roleMap[application.desiredMembershipType];

      // 1. Update Application Status
      application.status = ApplicationStatus.APPROVED;
      application.processedByAdminId = adminUserPayload.sub;
      application.decisionNotes = decisionDto.decisionNotes ?? null;
      await queryRunner.manager.save(Application, application);

      // 2. Assign Role to User (within transaction)
      this.logger.debug(`[App ${id}] Finding role with slug: ${roleToAssignSlug}`);
      const roleToAssign = await queryRunner.manager.findOneBy(Role, { slug: roleToAssignSlug });
      if (!roleToAssign) {
          this.logger.error(`[App ${id}] Role with slug ${roleToAssignSlug} not found!`);
          throw new InternalServerErrorException(`Role with slug ${roleToAssignSlug} not found during approval.`);
      }
      this.logger.debug(`[App ${id}] Found role: ${roleToAssign.name}. Assigning to user ${application.userId}...`);
      // Add role to the user's roles relation directly using the manager
      await queryRunner.manager
          .createQueryBuilder()
          .relation(User, 'roles')
          .of(application.user) // user entity loaded within transaction
          .add(roleToAssign);
      this.logger.debug(`[App ${id}] Role assigned to user ${application.userId}.`);

      // 3. Generate and Set Password
      // Generate a slightly better temporary password (still recommend crypto for production)
      const tempPassword = 
          Math.random().toString(36).substring(2, 10) + 
          Math.random().toString(36).substring(2, 6).toUpperCase(); 
      this.logger.debug(`[App ${id}] Generated temporary password for user ${application.userId}`);
      // Use the UserService to set the password (hashing happens in User entity hook)
      await this.userService.setUserPassword(application.userId, tempPassword);
      this.logger.debug(`[App ${id}] Temporary password set for user ${application.userId}.`);

      // 4. Send Welcome Email (Keep commented out for now)
      // try {
      //   await this.mailerService.sendWelcomeEmail(application.user, tempPassword);
      //   this.logger.log(`Welcome email sent to ${application.user.email} for application ${id}`);
      // } catch (emailError) {
      //   this.logger.error(`Failed to send welcome email for application ${id} to ${application.user.email}`, emailError.stack);
      // }

      // Commit transaction
      this.logger.debug(`[App ${id}] Committing transaction...`);
      await queryRunner.commitTransaction();
      this.logger.debug(`[App ${id}] Transaction committed.`);

      this.logger.log(`Application ID ${id} approved by admin ${adminUserPayload.sub}`);
      return application;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to approve application ID: ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to approve application.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Declines an application.
   * @param id - Application ID.
   * @param decisionDto - DTO with optional notes.
   * @param adminUserPayload - JWT payload of the admin performing the action.
   * @returns The updated application entity.
   */
  async declineApplication(
    id: number,
    decisionDto: DecisionDto,
    adminUserPayload: JwtPayload,
  ): Promise<Application> {
    // Use a transaction for consistency, although simpler than approve
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const application = await queryRunner.manager.findOne(Application, {
            where: { id },
            lock: { mode: 'pessimistic_write' }, // Lock row
        });

        if (!application) {
            throw new NotFoundException(`Application with ID ${id} not found`);
        }

        if (application.status === ApplicationStatus.APPROVED || application.status === ApplicationStatus.DECLINED) {
            throw new BadRequestException(`Application has already been processed (Status: ${application.status})`);
        }

        application.status = ApplicationStatus.DECLINED;
        application.processedByAdminId = adminUserPayload.sub;
        application.decisionNotes = decisionDto.decisionNotes ?? null;

        const savedApplication = await queryRunner.manager.save(Application, application);

        await queryRunner.commitTransaction();

        this.logger.log(`Application ID ${id} declined by admin ${adminUserPayload.sub}`);
        // Optionally send a rejection email here
        return savedApplication;

    } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Failed to decline application ID: ${id}`, error.stack);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException('Failed to decline application.');
    } finally {
        await queryRunner.release();
    }
  }
}