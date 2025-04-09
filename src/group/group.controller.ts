import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GroupBasicResponseDto } from './dto/response/group-basic-response.dto';
import { GroupDetailResponseDto, CreatedByUserDto } from './dto/response/group-detail-response.dto';
import { GroupMemberResponseDto } from './dto/response/group-member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Group } from '../database/entities/group.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';

// --- Helper Mappers ---
const mapGroupToBasicDto = (group: Group): GroupBasicResponseDto => ({
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
});

const mapMembershipToMemberDto = (m: GroupMembership): GroupMemberResponseDto | null => {
    if (!m.user || !m.role) return null;
    return {
        user: { id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl },
        role: { slug: m.role.slug, name: m.role.name },
        joinedAt: m.joinedAt,
    };
};

const mapGroupToDetailDto = (group: Group): GroupDetailResponseDto => ({
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    createdByUser: group.createdByUser ? { id: group.createdByUser.id, name: group.createdByUser.name } : null,
    members: group.memberships ? group.memberships.map(mapMembershipToMemberDto).filter((m): m is GroupMemberResponseDto => m !== null) : [],
});
// ---

// Interface for paginated basic group response
interface PaginatedGroupBasicResponseDto {
    data: GroupBasicResponseDto[];
    total: number;
    page: number;
    limit: number;
}

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard) // Protect all group routes
@ApiBearerAuth()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group', description: 'Creates a new group and sets the creator as the first leader.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Group created successfully.', type: GroupBasicResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async createGroup(
    @Request() req: { user: JwtPayload },
    @Body() dto: CreateGroupDto,
  ): Promise<GroupBasicResponseDto> {
    const group = await this.groupService.createGroup(req.user.sub, dto);
    return mapGroupToBasicDto(group);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of groups', description: 'Retrieves a paginated list of groups.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10, maximum: 100 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of groups.', schema: { /* Define schema manually or create DTO */ } })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findAllGroups(
      @Query('page', new ParseIntPipe({ optional: true })) page?: number,
      @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<PaginatedGroupBasicResponseDto> {
    const result = await this.groupService.findAllGroups(page, limit);
    return {
        ...result,
        data: result.data.map(mapGroupToBasicDto)
    };
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get group details', description: 'Retrieves details of a specific group including members.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Group details.', type: GroupDetailResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findGroupById(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.groupService.findGroupById(groupId);
    return mapGroupToDetailDto(group);
  }

  @Put(':groupId')
  @ApiOperation({ summary: 'Update group details', description: 'Updates the name or description of a group. Requires leader role.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Group updated successfully.', type: GroupBasicResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden. Only leaders can update.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupBasicResponseDto> {
    const group = await this.groupService.updateGroup(groupId, req.user.sub, dto);
    return mapGroupToBasicDto(group);
  }

  @Delete(':groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group', description: 'Deletes a group and all its memberships. Requires leader role.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Group deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden. Only leaders can delete.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async deleteGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    await this.groupService.deleteGroup(groupId, req.user.sub);
  }

  // --- Membership Endpoints ---

  @Post(':groupId/join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a group', description: 'Adds the current user as a member to the specified group.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully joined group.', type: GroupMemberResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User is already a member.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Request() req: { user: JwtPayload },
  ): Promise<GroupMemberResponseDto> {
      const membership = await this.groupService.joinGroup(groupId, req.user.sub);
      // Need to reload membership with relations for mapping
      const reloadedMembership = await this.groupService.findGroupMembers(groupId).then(members => members.find(m => m.id === membership.id)!);
      return mapMembershipToMemberDto(reloadedMembership);
  }

  @Delete(':groupId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a group', description: 'Removes the current user from the specified group.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Successfully left group.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group or membership not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async leaveGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    await this.groupService.leaveGroup(groupId, req.user.sub);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'List group members', description: 'Retrieves a list of members for a specific group.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of group members.', type: [GroupMemberResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findGroupMembers(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<GroupMemberResponseDto[]> {
    const memberships = await this.groupService.findGroupMembers(groupId);
    // Filter out nulls and assert type
    return memberships.map(mapMembershipToMemberDto).filter(Boolean) as GroupMemberResponseDto[];
  }

  @Put(':groupId/members/:userId/role')
  @ApiOperation({ summary: 'Update member role', description: 'Changes the role of a member within a group. Requires leader role.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiParam({ name: 'userId', type: Number, description: 'ID of the user whose role is being changed' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member role updated.', type: GroupMemberResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group, user, or membership not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden. Only leaders can change roles.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid role slug or cannot change own role.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async updateMemberRole(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<GroupMemberResponseDto> {
      const updatedMembership = await this.groupService.updateMemberRole(groupId, targetUserId, req.user.sub, dto);
      // Reload to ensure relations are present for mapping
      const reloadedMembership = await this.groupService.findGroupMembers(groupId).then(members => members.find(m => m.id === updatedMembership.id)!);
      const mapped = mapMembershipToMemberDto(reloadedMembership);
      if (!mapped) throw new InternalServerErrorException('Failed to map updated membership');
      return mapped; // Already checked for null
  }

  @Delete(':groupId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from group', description: 'Removes a member from a group. Requires leader role.' })
  @ApiParam({ name: 'groupId', type: Number })
  @ApiParam({ name: 'userId', type: Number, description: 'ID of the user to remove' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Member removed successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group, user, or membership not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden. Only leaders can remove members.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot remove self.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async removeMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    await this.groupService.removeMember(groupId, targetUserId, req.user.sub);
  }
}
