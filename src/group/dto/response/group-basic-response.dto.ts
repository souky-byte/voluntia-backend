import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GroupBasicResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Marketing Team' })
    name: string;

    @ApiPropertyOptional({ example: 'Responsible for marketing campaigns.' })
    description: string | null;

    @ApiProperty({ example: '2024-04-09T10:00:00.000Z' })
    createdAt: Date;

    // Maybe add createdByUser info if needed
} 