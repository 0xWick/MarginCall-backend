import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Signal } from './signal.entity';

@Entity('signal_history')
export class SignalHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  signalId: number;

  @ManyToOne(() => Signal, signal => signal.history)
  @JoinColumn({ name: 'signalId' })
  signal: Signal;

  @Column('jsonb')
  triggerData: Record<string, any>;

  @Column()
  triggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
} 