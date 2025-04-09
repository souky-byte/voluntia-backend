import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipType } from '../../../database/enums/membership-type.enum';
import { ApplicationStatus } from '../../../database/enums/application-status.enum';

class ApplicantDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+420123456789' })
  phone_number?: string | null;
}

class ProcessedByAdminDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Admin User' })
  name: string;
}

/**
 * Detailed Response DTO for an application (Admin view).
 */
export class ApplicationAdminDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: MembershipType, example: MembershipType.MEMBER })
  desiredMembershipType: MembershipType;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Some motivation text' })
  motivation: string | null;

  @ApiPropertyOptional({ description: 'Specific data based on membership type', example: { city: 'Prague' } })
  additionalData: Record<string, any> | null;

  @ApiPropertyOptional({ example: '2024-04-15T10:00:00.000Z' })
  callScheduledAt: Date | null;

  @ApiPropertyOptional({ description: 'Notes added by the admin during processing' })
  decisionNotes: string | null;

  @ApiProperty({ example: '2024-04-08T17:00:26.529Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-04-08T18:30:00.123Z' })
  updatedAt: Date;

  @ApiProperty({ type: ApplicantDto, description: 'Details of the applicant' })
  user: ApplicantDto;

  @ApiPropertyOptional({ type: ProcessedByAdminDto, description: 'Admin who processed the application' })
  processedByAdmin: ProcessedByAdminDto | null;
} 