import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  // Liveness must not depend on Postgres, or a database blip would restart healthy pods.
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
