import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { GroupMembership } from './group-membership.entity'; // Verify this import

@Entity('group_roles')
@Unique(['slug']) // Ensure slugs are unique
export class GroupRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g., 'Leader', 'Member', 'Observer'

  @Column({ type: 'varchar', length: 50 })
  slug: string; // e.g., 'leader', 'member', 'observer'

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => GroupMembership, (membership) => membership.role)
  memberships: GroupMembership[];

  // No timestamps needed for roles usually
} 