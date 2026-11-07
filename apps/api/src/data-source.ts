import { DataSource, type DataSourceOptions } from 'typeorm';
import { Lead } from './leads/lead.entity.js';
import { CreateLeads1731000000000 } from './migrations/1731000000000-create-leads.js';

export function dataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  return {
    type: 'postgres',
    url,
    entities: [Lead],
    migrations: [CreateLeads1731000000000],
    // Schema changes only ever happen through migrations (see src/migrate.ts).
    synchronize: false,
  };
}

export const createDataSource = () => new DataSource(dataSourceOptions());
