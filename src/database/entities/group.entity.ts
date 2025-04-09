import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
// import { GroupMembership } from './group-membership.entity'; // Verify this import
import { GroupMembership } from '@database/entities/group-membership.entity'; // Use path alias

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, (user) => user.createdGroups, { nullable: false })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: number;

  @OneToMany(() => GroupMembership, (membership) => membership.group)
  memberships: GroupMembership[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 