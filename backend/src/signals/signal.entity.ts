import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { SignalHistory } from './signal-history.entity';

export enum ComparisonOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUAL = '=',
  GREATER_THAN_EQUAL = '>=',
  LESS_THAN_EQUAL = '<=',
}

export enum SignalType {
  METRIC_TO_METRIC = 'metric_to_metric',
  METRIC_TO_VALUE = 'metric_to_value',
  METRIC_TO_PERCENTAGE = 'metric_to_percentage',
}

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  companyTicker: string;

  @Column()
  companyName: string;

  @ManyToOne(() => User, user => user.signals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  leftMetric: string;

  @Column({
    type: 'enum',
    enum: ComparisonOperator,
  })
  operator: ComparisonOperator;

  @Column()
  rightMetric: string;

  @Column({
    type: 'enum',
    enum: SignalType,
  })
  signalType: SignalType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isTriggered: boolean;

  @Column({ nullable: true })
  lastTriggeredAt: Date;

  @Column({ nullable: true })
  lastUpdated: Date;

  @Column({ type: 'jsonb', nullable: true })
  lastData: any;

  @Column({ type: 'jsonb', nullable: true })
  initialValues: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SignalHistory, history => history.signal)
  history: SignalHistory[];
} 