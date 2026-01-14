import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from './role/role.module';
import { Role } from './role/entities/role.entity';
import { AuthModule } from './auth/auth.module';
import { Auth } from './auth/entities/auth.entity';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { FileUploadModule } from './file-upload/file-upload.module';
import { File } from './file-upload/entities/file.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventModule } from './event/event.module';
import { WialonModule } from './wialon/wialon.module';
import { Unit } from './wialon/entities/unit.entity';
import { UnitEngineHours } from './wialon/entities/unit-engine-hours.entity';
import { WialonHistoryModule } from './wialon-history/wialon-history.module';
import { DailyReport } from './wialon-history/entities/daily-report.entity';

@Module({
  imports: [
    //scheduler module
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      autoLoadEntities: true,
      synchronize: true,
      entities: [Role, Auth, File, Unit, UnitEngineHours, DailyReport],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 30000, //time to live in ms
      max: 100, //number of items
    }),
    RoleModule,
    AuthModule,
    FileUploadModule,
    EventModule,
    WialonModule,
    WialonHistoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
