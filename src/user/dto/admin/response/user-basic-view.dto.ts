import { ApiProperty } from '@nestjs/swagger';

export class UserBasicViewDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;

  // No roles, timestamps, or other sensitive info
} 