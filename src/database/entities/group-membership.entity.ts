import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';
import { GroupRole } from './group-role.entity';

@Entity('group_memberships')
@Unique(['user', 'group']) // Ensure a user can only be in a group once
export class GroupMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.groupMemberships, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Group, (group) => group.memberships, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  groupId: number;

  @ManyToOne(() => GroupRole, (role) => role.memberships, { nullable: false, eager: true }) // Eager load the role
  @JoinColumn({ name: 'group_role_id' })
  role: GroupRole;

  @Column({ name: 'group_role_id' })
  groupRoleId: number;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
} 