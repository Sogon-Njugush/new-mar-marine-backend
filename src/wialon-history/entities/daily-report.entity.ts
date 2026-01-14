import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('wialon_daily_reports')
@Index(['unitId', 'date', 'reportName'], { unique: true }) // Fast lookup by day
export class DailyReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  unitId: number;

  @Column()
  unitName: string;

  @Column({ type: 'date' })
  date: string; // Format: YYYY-MM-DD

  @Column()
  reportName: string; // e.g., "Motion", "Machine Activity"

  // 👇 Stores the "Stats" (Total Fuel, Duration, etc.)
  @Column({ type: 'jsonb', default: [] })
  stats: any;

  // 👇 Stores the "Tables" (Engine Hours rows, Sensor rows, etc.)
  @Column({ type: 'jsonb', default: [] })
  tables: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  syncedAt: Date;
}
