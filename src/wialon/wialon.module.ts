import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WialonService } from './wialon.service';
import { Unit } from './entities/unit.entity';
import { UnitEngineHours } from './entities/unit-engine-hours.entity';
import { WialonController } from './wialon.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Unit, UnitEngineHours]),
  ],
  controllers: [WialonController],
  providers: [WialonService],
  exports: [WialonService],
})
export class WialonModule {}
