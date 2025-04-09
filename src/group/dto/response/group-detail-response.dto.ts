import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupMemberResponseDto } from './group-member-response.dto';

// DTO for the user who created the group
export class CreatedByUserDto {
    @ApiProperty({ example: 5 })
    id: number;
    @ApiProperty({ example: 'Group Creator' })
    name: string;
}

export class GroupDetailResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Marketing Team' })
    name: string;

    @ApiPropertyOptional({ example: 'Responsible for marketing campaigns.' })
    description: string | null;

    @ApiProperty({ example: '2024-04-09T10:00:00.000Z' })
    createdAt: Date;

    @ApiPropertyOptional({ type: CreatedByUserDto, description: 'User who created the group', nullable: true })
    createdByUser: CreatedByUserDto | null;

    @ApiProperty({ type: [GroupMemberResponseDto], description: 'List of group members and their roles' })
    members: GroupMemberResponseDto[];
} 