import { ApiProperty } from '@nestjs/swagger';
import { MembershipType } from '../../../database/enums/membership-type.enum';
import { ApplicationStatus } from '../../../database/enums/application-status.enum';

/**
 * Response DTO after successfully submitting an application.
 */
export class ApplicationPublicResponseDto {
  @ApiProperty({ example: 1, description: 'Unique ID of the created application' })
  id: number;

  @ApiProperty({ example: 1, description: 'Unique ID of the created user associated with the application' })
  userId: number;

  @ApiProperty({ enum: MembershipType, example: MembershipType.MEMBER, description: 'Desired membership type submitted' })
  desiredMembershipType: MembershipType;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.PENDING, description: 'Initial status of the application' })
  status: ApplicationStatus;

  @ApiProperty({ example: '2024-04-08T17:00:26.529Z', description: 'Timestamp when the application was created' })
  createdAt: Date;
} 