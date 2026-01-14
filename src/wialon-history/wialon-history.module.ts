import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WialonHistoryService } from './wialon-history.service';
import { WialonHistoryController } from './wialon-history.controller';
import { DailyReport } from './entities/daily-report.entity';
import { WialonModule } from '../wialon/wialon.module'; // Import existing module

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReport]), // Register new entity
    WialonModule,
  ],
  controllers: [WialonHistoryController],
  providers: [WialonHistoryService],
})
export class WialonHistoryModule {}
