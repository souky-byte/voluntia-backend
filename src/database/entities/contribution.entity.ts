import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ContributionStatus {
  PENDING = 'pending',     // Payment initiated, waiting for Stripe confirmation
  SUCCEEDED = 'succeeded', // Payment successful
  FAILED = 'failed',       // Payment failed
}

@Entity('contributions')
export class Contribution {
  @PrimaryGeneratedColumn()
  id: number;

  // Link to the user who made the contribution
  @ManyToOne(() => User, (user) => user.id, { nullable: false, eager: false })
  user: User;

  // Store the amount in the smallest currency unit (e.g., cents)
  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'eur' }) // Default to EUR
  currency: string;

  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  status: ContributionStatus;

  // Store the Stripe Payment Intent ID to link the contribution
  // and prevent processing duplicates in webhook
  @Index() // Index for faster lookup in webhook
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  stripePaymentIntentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
