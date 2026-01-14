import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { UnitEngineHours } from './unit-engine-hours.entity';

@Entity('units')
export class Unit {
  @PrimaryColumn() // Wialon ID
  id: number;

  @Column()
  name: string;

  @OneToMany(() => UnitEngineHours, (report) => report.unit)
  engineHours: UnitEngineHours[];
}
