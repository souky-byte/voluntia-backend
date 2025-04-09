import { ApiProperty } from '@nestjs/swagger';
import { ApplicationAdminDetailDto } from './application-admin-detail.dto'; // Use the detailed DTO for list items

export class PaginatedApplicationResponseDto {
  @ApiProperty({
    type: [ApplicationAdminDetailDto],
    description: 'Array of application objects for the current page',
  })
  data: ApplicationAdminDetailDto[];

  @ApiProperty({ example: 2, description: 'Total number of applications matching the query' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
} 