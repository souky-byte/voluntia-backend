import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Group } from '../database/entities/group.entity';
import { GroupRole } from '../database/entities/group-role.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { User } from '../database/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

// Define PaginatedGroupsResult similar to users/applications
export interface PaginatedGroupsResult {
    data: Group[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class GroupService implements OnModuleInit {
  private readonly logger = new Logger(GroupService.name);
  private readonly DEFAULT_MEMBER_ROLE_SLUG = 'member';
  private readonly LEADER_ROLE_SLUG = 'leader';

  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupRole)
    private readonly groupRoleRepository: Repository<GroupRole>,
    @InjectRepository(GroupMembership)
    private readonly groupMembershipRepository: Repository<GroupMembership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Temporary method to ensure roles exist on startup for manual testing
  async onModuleInit() {
      this.logger.log('Ensuring default group roles exist...');
      const rolesToEnsure = [
          { name: 'Leader', slug: this.LEADER_ROLE_SLUG, description: 'Manages the group and its members' },
          { name: 'Member', slug: this.DEFAULT_MEMBER_ROLE_SLUG, description: 'Regular member of the group' },
      ];
      for (const roleData of rolesToEnsure) {
          let role = await this.groupRoleRepository.findOneBy({ slug: roleData.slug });
          if (!role) {
              role = this.groupRoleRepository.create(roleData);
              await this.groupRoleRepository.save(role);
              this.logger.log(`Created missing group role: ${roleData.name}`);
          }
      }
      this.logger.log('Default group roles checked.');
  }

  // --- Helper Methods ---

  /** Checks if a user has the 'leader' role in a specific group. */
  async isGroupLeader(groupId: number, userId: number): Promise<boolean> {
    const membership = await this.groupMembershipRepository.findOne({
        where: { groupId, userId },
        relations: ['role'], // Ensure role is loaded
    });
    return !!membership && membership.role.slug === this.LEADER_ROLE_SLUG;
  }

  /** Finds a group role by slug, throws NotFoundException if not found. */
  private async findGroupRoleOrFail(slug: string): Promise<GroupRole> {
    const role = await this.groupRoleRepository.findOneBy({ slug });
    if (!role) {
      this.logger.error(`Group role with slug '${slug}' not found.`);
      throw new InternalServerErrorException(`Group role '${slug}' not configured.`);
    }
    return role;
  }

  // --- Core Service Methods ---

  async createGroup(userId: number, dto: CreateGroupDto): Promise<Group> {
    // Find creator and leader role BEFORE transaction
    const creator = await this.userRepository.findOneBy({ id: userId });
    if (!creator) throw new NotFoundException(`User with ID ${userId} not found`);

    const leaderRole = await this.findGroupRoleOrFail(this.LEADER_ROLE_SLUG);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pre-fetched creator and leaderRole
      // 1. Create Group
      const newGroup = queryRunner.manager.create(Group, {
          ...dto,
          createdByUser: creator,
          createdByUserId: userId,
      });
      const savedGroup = await queryRunner.manager.save(Group, newGroup);

      // 2. Add creator as leader
      const initialMembership = queryRunner.manager.create(GroupMembership, {
          user: creator,
          userId: userId,
          group: savedGroup,
          groupId: savedGroup.id,
          role: leaderRole,
          groupRoleId: leaderRole.id,
      });
      await queryRunner.manager.save(GroupMembership, initialMembership);

      await queryRunner.commitTransaction();
      this.logger.log(`Group '${savedGroup.name}' (ID: ${savedGroup.id}) created by user ${userId}`);
      // Return group without memberships for this specific response maybe?
      return savedGroup;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create group for user ${userId}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to create group.');
    } finally {
      await queryRunner.release();
    }
  }

  // Basic pagination - enhance with filtering/search later if needed
  async findAllGroups(page = 1, limit = 10): Promise<PaginatedGroupsResult> {
    const skip = (page - 1) * limit;
    const [groups, total] = await this.groupRepository.findAndCount({
        order: { createdAt: 'DESC' },
        skip: skip,
        take: limit,
        relations: ['createdByUser'], // Load creator basic info
    });
    return { data: groups, total, page: Number(page), limit: Number(limit) };
  }

  async findGroupById(groupId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
        where: { id: groupId },
        relations: [
            'createdByUser', // Get creator info
            'memberships', // Get memberships
            'memberships.user', // Get user info for each membership
            'memberships.role', // Get role info for each membership
        ],
    });
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
    return group;
  }

  async updateGroup(groupId: number, userId: number, dto: UpdateGroupDto): Promise<Group> {
    const isLeader = await this.isGroupLeader(groupId, userId);
    // Add check if user is the creator if needed: group.createdByUserId === userId
    if (!isLeader) {
        throw new ForbiddenException('Only group leaders can update group details.');
    }
    const group = await this.findGroupById(groupId); // Ensures group exists

    // Update fields from DTO
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description;

    return this.groupRepository.save(group);
  }

  async deleteGroup(groupId: number, userId: number): Promise<void> {
    const isLeader = await this.isGroupLeader(groupId, userId);
     // Add check if user is the creator if needed
    if (!isLeader) {
        throw new ForbiddenException('Only group leaders can delete the group.');
    }
    const group = await this.findGroupById(groupId); // Ensures group exists

    // Deletion will cascade to memberships due to onDelete: 'CASCADE' in GroupMembership
    const deleteResult = await this.groupRepository.delete(groupId);
    if (deleteResult.affected === 0) {
        throw new NotFoundException(`Group with ID ${groupId} not found during delete.`);
    }
    this.logger.log(`Group ${groupId} deleted by user ${userId}`);
  }

  async joinGroup(groupId: number, userId: number): Promise<GroupMembership> {
    // Check if group exists
    const group = await this.groupRepository.findOneBy({ id: groupId });
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);

    // Check if user exists
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    // Check if already a member
    const existingMembership = await this.groupMembershipRepository.findOneBy({ groupId, userId });
    if (existingMembership) {
        throw new ConflictException('User is already a member of this group.');
    }

    const memberRole = await this.findGroupRoleOrFail(this.DEFAULT_MEMBER_ROLE_SLUG);

    const newMembership = this.groupMembershipRepository.create({
        user,
        userId,
        group,
        groupId,
        role: memberRole,
        groupRoleId: memberRole.id,
    });

    return this.groupMembershipRepository.save(newMembership);
  }

  async leaveGroup(groupId: number, userId: number): Promise<void> {
    const deleteResult = await this.groupMembershipRepository.delete({ groupId, userId });
    if (deleteResult.affected === 0) {
        throw new NotFoundException('Membership not found for this user and group.');
    }
    // TODO: Add logic if the leaving user was the only leader?
    this.logger.log(`User ${userId} left group ${groupId}`);
  }

  async findGroupMembers(groupId: number): Promise<GroupMembership[]> {
     // Check if group exists first?
     const groupExists = await this.groupRepository.existsBy({ id: groupId });
     if (!groupExists) throw new NotFoundException(`Group with ID ${groupId} not found`);

    return this.groupMembershipRepository.find({
        where: { groupId },
        relations: ['user', 'role'],
        order: { joinedAt: 'ASC' }
    });
  }

  async updateMemberRole(groupId: number, targetUserId: number, performingUserId: number, dto: UpdateMemberRoleDto): Promise<GroupMembership> {
    if (targetUserId === performingUserId) {
        throw new BadRequestException('Leader cannot change their own role this way.');
    }
    const isLeader = await this.isGroupLeader(groupId, performingUserId);
    if (!isLeader) {
        throw new ForbiddenException('Only group leaders can change member roles.');
    }

    const membership = await this.groupMembershipRepository.findOneBy({ groupId, userId: targetUserId });
    if (!membership) {
        throw new NotFoundException(`User ${targetUserId} is not a member of group ${groupId}.`);
    }

    const newRole = await this.findGroupRoleOrFail(dto.roleSlug);

    membership.role = newRole;
    membership.groupRoleId = newRole.id;

    return this.groupMembershipRepository.save(membership);
  }

  async removeMember(groupId: number, targetUserId: number, performingUserId: number): Promise<void> {
      if (targetUserId === performingUserId) {
        throw new BadRequestException('Leader cannot remove themselves this way, use leaveGroup.');
      }
      const isLeader = await this.isGroupLeader(groupId, performingUserId);
      if (!isLeader) {
        throw new ForbiddenException('Only group leaders can remove members.');
      }

      const deleteResult = await this.groupMembershipRepository.delete({ groupId, userId: targetUserId });
      if (deleteResult.affected === 0) {
        throw new NotFoundException(`User ${targetUserId} not found in group ${groupId}.`);
      }
      this.logger.log(`User ${targetUserId} removed from group ${groupId} by user ${performingUserId}`);
  }
}
