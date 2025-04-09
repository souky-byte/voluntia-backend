import { ApiProperty } from '@nestjs/swagger';
import { UserAdminViewDto } from './user-admin-view.dto';

export class PaginatedUsersResponseDto {
  @ApiProperty({
    type: [UserAdminViewDto],
    description: 'Array of user objects for the current page',
  })
  data: UserAdminViewDto[];

  @ApiProperty({ example: 50, description: 'Total number of users matching the query' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
} 