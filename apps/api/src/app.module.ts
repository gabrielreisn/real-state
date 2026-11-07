import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source.js';
import { HealthController } from './health/health.controller.js';
import { LeadsModule } from './leads/leads.module.js';

@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: dataSourceOptions }), LeadsModule],
  controllers: [HealthController],
})
export class AppModule {}
