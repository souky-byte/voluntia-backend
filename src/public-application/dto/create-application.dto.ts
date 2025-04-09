import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  ValidateIf,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  IsDateString,
  IsObject,
  ValidateNested,
  IsBoolean,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipType } from '../../database/enums/membership-type.enum';

// Nested DTO for additional data for Supporters
class SupporterAdditionalDataDto {
  @ApiProperty({ example: 'Prague', description: 'City of residence' })
  @IsString()
  @IsNotEmpty()
  readonly city: string;
}

// Nested DTO for additional data for Members
class MemberAdditionalDataDto {
  @ApiProperty({ example: 'Main Street 123, 11000 Prague 1', description: 'Full residential address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  readonly full_address: string;

  @ApiProperty({ example: '1990-12-31', description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  readonly date_of_birth: string;

  @ApiPropertyOptional({ example: 'Software Developer', description: 'Profession' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly profession?: string;
}

export class CreateApplicationDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the applicant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Contact email address' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ enum: MembershipType, description: 'Desired type of membership' })
  @IsEnum(MembershipType)
  @IsNotEmpty()
  readonly desiredMembershipType: MembershipType;

  @ApiPropertyOptional({ description: 'Motivation for joining (optional for Community, required otherwise)' })
  @IsString()
  @ValidateIf(o => o.desiredMembershipType !== MembershipType.COMMUNITY)
  @IsNotEmpty({ message: 'Motivation is required for Supporters and Members' })
  @IsOptional()
  @MaxLength(5000) // Allow longer text for motivation
  readonly motivation?: string;

  // Conditional fields based on type

  @ApiPropertyOptional({ example: '+420123456789', description: 'Phone number (required for Supporters and Members)' })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.SUPPORTER || o.desiredMembershipType === MembershipType.MEMBER)
  @IsNotEmpty({ message: 'Phone number is required for Supporters and Members' })
  // @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' }) // Keep commented for now
  readonly phone_number: string; // Make non-optional - presence is checked by ValidateIf/IsNotEmpty

  // Consent flags - Make non-optional, validation depends on ValidateIf
  @ApiProperty({ type: Boolean, description: 'Confirmation of GDPR consent (frontend handles display)' })
  @IsBoolean()
  @Equals(true, { message: 'GDPR consent confirmation is required' }) // Use @Equals(true) for required boolean
  readonly gdprConsent: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Confirmation of agreement with supporter statutes (required for Supporters)' })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.SUPPORTER)
  @IsNotEmpty({ message: 'Agreement with supporter statutes is required for Supporters' })
  @IsBoolean()
  @Equals(true, { message: 'Agreement with supporter statutes must be true for Supporters' })
  readonly supporterStatutesConsent: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Confirmation of agreement with party statutes (required for Members)' })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.MEMBER)
  @IsNotEmpty({ message: 'Agreement with party statutes is required for Members' })
  @IsBoolean()
  @Equals(true, { message: 'Agreement with party statutes must be true for Members' })
  readonly partyStatutesConsent: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Declaration of no other party membership (required for Members)' })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.MEMBER)
  @IsNotEmpty({ message: 'Declaration of no other party membership is required for Members' })
  @IsBoolean()
  @Equals(true, { message: 'Declaration of no other party membership must be true for Members' })
  readonly noOtherPartyMembership: boolean;

  // Nested validation for additional_data
  @ApiPropertyOptional({ description: 'Additional data specific to the membership type (Required for Supporter)', type: SupporterAdditionalDataDto })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.SUPPORTER)
  @IsNotEmpty({ message: 'Additional data is required for Supporters' })
  @IsObject()
  @ValidateNested()
  @Type(() => SupporterAdditionalDataDto)
  readonly additionalDataSupporter: SupporterAdditionalDataDto;

  @ApiPropertyOptional({ description: 'Additional data specific to the membership type (Required for Member)', type: MemberAdditionalDataDto })
  @ValidateIf(o => o.desiredMembershipType === MembershipType.MEMBER)
  @IsNotEmpty({ message: 'Additional data is required for Members' })
  @IsObject()
  @ValidateNested()
  @Type(() => MemberAdditionalDataDto)
  readonly additionalDataMember: MemberAdditionalDataDto;

} 