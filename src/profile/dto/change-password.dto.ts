import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Custom validator for password confirmation
@ValidatorConstraint({ name: 'matchesProperty', async: false })
export class MatchesPropertyConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    // Capitalize first letter for better message
    const propertyName = relatedPropertyName.charAt(0).toUpperCase() + relatedPropertyName.slice(1);
    return `$property must match ${propertyName}`;
  }
}

export class ChangePasswordDto {
  @ApiProperty({ description: "User's current password", minLength: 8 })
  @IsString()
  @IsNotEmpty()
  readonly currentPassword: string;

  @ApiProperty({
    description: "New password (at least 8 characters, one uppercase, one lowercase, one number)",
    minLength: 8,
    maxLength: 100,
    example: 'NewSecurePa$$w0rd',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  readonly newPassword: string;

  @ApiProperty({ description: "Confirmation of the new password", minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @Validate(MatchesPropertyConstraint, ['newPassword'], {
      message: "Passwords do not match"
  })
  readonly confirmPassword: string;
} 