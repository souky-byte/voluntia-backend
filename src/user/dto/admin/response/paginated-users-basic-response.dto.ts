import { ApiProperty } from '@nestjs/swagger';
import { UserBasicViewDto } from './user-basic-view.dto';

export class PaginatedUsersBasicResponseDto {
  @ApiProperty({
    type: [UserBasicViewDto],
    description: 'Array of basic user objects for the current page',
  })
  data: UserBasicViewDto[];

  @ApiProperty({ example: 50, description: 'Total number of users matching the query' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
} 