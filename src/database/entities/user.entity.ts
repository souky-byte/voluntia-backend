import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Timestamp,
  OneToOne,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Role } from './role.entity';
import { Application } from './application.entity';
import * as bcrypt from 'bcrypt';
// Import new entities for Group feature (will be created later)
// import { Group } from './group.entity';
// import { GroupMembership } from './group-membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone_number: string | null;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false }) // Hide password by default
  password?: string | null;

  // Removed remember_token as it's less common with API tokens

  @ManyToMany(() => Role, {
    cascade: true, // Optional: Cascade insert/update of roles
    eager: true,   // Optional: Always load roles with user
  })
  @JoinTable({ // Specifies the owner side of the relationship
    name: 'role_user', // table name for the junction table
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // One user can have one application initially
  @OneToOne(() => Application, (application) => application.user)
  application: Application;

  // One user (admin) can process many applications
  // This relation is defined on the Application entity (processedByAdmin)

  // --- New Profile Fields ---
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;
  // ---

  // --- New Group Relations (add later when entities exist) ---
  // @OneToMany(() => Group, (group) => group.createdByUser)
  // createdGroups: Group[];

  // @OneToMany(() => GroupMembership, (membership) => membership.user)
  // groupMemberships: GroupMembership[];
  // ---

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ select: false }) // Hide soft-deleted records by default
  deleted_at?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword?(): Promise<void> {
    // Hash password only if it exists and is not already hashed (simple check)
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
} 