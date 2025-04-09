import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MembershipType } from '../database/enums/membership-type.enum';
import { ApplicationStatus } from '../database/enums/application-status.enum';

@Injectable()
export class PublicApplicationService {
  private readonly logger = new Logger(PublicApplicationService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly userService: UserService,
    // Inject DataSource to use transactions if needed (more robust)
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new user and their application.
   * Handles potential conflicts and uses a transaction.
   * @param createApplicationDto - Data transfer object containing application details.
   * @returns The newly created application entity.
   * @throws ConflictException if the email is already registered.
   * @throws InternalServerErrorException on unexpected errors.
   */
  async createApplication(createApplicationDto: CreateApplicationDto): Promise<Application> {
    // Destructure DTO
    const {
      name,
      email,
      desiredMembershipType,
      motivation,
      phone_number,
      additionalDataSupporter,
      additionalDataMember,
      // Consent flags are validated but not directly stored in DB unless required
      gdprConsent,
      supporterStatutesConsent,
      partyStatutesConsent,
      noOtherPartyMembership,
    } = createApplicationDto;

    // Combine additional data based on type
    let combinedAdditionalData: Record<string, any> | null = null;
    if (desiredMembershipType === MembershipType.SUPPORTER && additionalDataSupporter) {
        combinedAdditionalData = { ...additionalDataSupporter };
    } else if (desiredMembershipType === MembershipType.MEMBER && additionalDataMember) {
        combinedAdditionalData = { ...additionalDataMember };
    }

    // Check if email already exists
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      // Consider if we allow re-application or handle differently
      this.logger.warn(`Attempt to create application for existing email: ${email}`);
      throw new ConflictException(
        'An account with this email already exists. Please contact support if you wish to re-apply.',
      );
    }

    // --- Start Transaction --- (Optional but recommended for multi-step operations)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create User (without password)
      const newUser = await queryRunner.manager.save(User, {
        name,
        email,
        phone_number: phone_number ?? null,
        // email_verified_at remains null initially
      });

      // 2. Create Application
      const newApplication = queryRunner.manager.create(Application, {
        user: newUser, // Link to the newly created user
        userId: newUser.id,
        desiredMembershipType,
        status: ApplicationStatus.PENDING, // Default status
        motivation: motivation ?? null,
        additionalData: combinedAdditionalData,
        // Other fields like callScheduledAt, processedByAdminId, decisionNotes are null initially
      });

      const savedApplication = await queryRunner.manager.save(Application, newApplication);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Successfully created application ID: ${savedApplication.id} for user email: ${email}`);
      return savedApplication;

    } catch (error) {
      // Rollback transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create application for email ${email}`, error.stack);

      // Re-throw specific errors or a generic one
      if (error instanceof ConflictException) {
        throw error; // Re-throw conflict if it originated from user creation check (though unlikely here)
      }
      // Log the detailed error for debugging
      console.error("Database error during application creation:", error);
      throw new InternalServerErrorException('Failed to create application due to a server error.');

    } finally {
      // Release query runner connection
      await queryRunner.release();
    }
    // --- End Transaction ---
  }
}
