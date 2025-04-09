import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Timestamp,
} from 'typeorm';
import { User } from './user.entity';
import { MembershipType } from '../enums/membership-type.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation to the user who submitted the application
  @OneToOne(() => User, (user) => user.application, { nullable: false, cascade: ['insert'] })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: MembershipType,
    name: 'desired_membership_type',
  })
  desiredMembershipType: MembershipType;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  motivation: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'additional_data' })
  additionalData: Record<string, any> | null; // For specific fields like city, address, dob

  @Column({ type: 'timestamp', nullable: true, name: 'call_scheduled_at' })
  callScheduledAt: Date | null;

  // Relation to the admin user who processed the application
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by_admin_id' })
  processedByAdmin: User | null;

  @Column({ name: 'processed_by_admin_id', nullable: true })
  processedByAdminId: number | null;

  @Column({ type: 'text', nullable: true, name: 'decision_notes' })
  decisionNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 