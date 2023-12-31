import { Module } from '@nestjs/common';
import { DoctorModule } from './doctor/doctor.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresOption, redisClientOption } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { SchedulesModule } from './schedule/schedule.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...postgresOption,
      autoLoadEntities: true
    }),
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      ...redisClientOption
    }),
    AuthModule,
    DoctorModule,
    SchedulesModule
  ],
})
export class AppModule { }
