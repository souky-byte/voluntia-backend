import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { User } from './user.entity'; // Import User entity

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // e.g., 'admin', 'community', 'supporter', 'member'

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string; // e.g., 'admin', 'community-member', 'registered-supporter', 'party-member'

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.roles)
  // Note: We don't typically need a direct reference to users from Role
  // This side of the relationship is often less queried
  users: User[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 