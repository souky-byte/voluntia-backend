import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MemberUserDto {
    @ApiProperty({ example: 10 })
    id: number;
    @ApiProperty({ example: 'Jane Doe' })
    name: string;
    @ApiPropertyOptional({ example: 'https://example.com/jane.jpg' })
    avatarUrl: string | null;
}

class MemberRoleDto {
    @ApiProperty({ example: 'member' })
    slug: string;
    @ApiProperty({ example: 'Member' })
    name: string;
}

export class GroupMemberResponseDto {
    @ApiProperty({ type: MemberUserDto })
    user: MemberUserDto;

    @ApiProperty({ type: MemberRoleDto })
    role: MemberRoleDto;

    @ApiProperty({ example: '2024-04-09T10:00:00.000Z' })
    joinedAt: Date;
} 