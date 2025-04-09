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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

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