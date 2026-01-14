import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('unit_engine_hours')
@Unique(['unit_id', 'time_begin']) // Prevent duplicates
export class UnitEngineHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  unit_id: number;

  @ManyToOne(() => Unit, (unit) => unit.engineHours)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ type: 'timestamp' })
  time_begin: Date;

  @Column({ type: 'timestamp' })
  time_end: Date;

  @Column({ type: 'int', default: 0 })
  duration_seconds: number;

  @Column({ type: 'float', default: 0, nullable: true })
  movement_utilization_percent: number;

  @Column({ type: 'float', default: 0, nullable: true })
  utilization_percent: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  fuel_level_begin: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  fuel_level_end: number;
}
