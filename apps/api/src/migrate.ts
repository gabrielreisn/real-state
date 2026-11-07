import 'reflect-metadata';
import { createDataSource } from './data-source.js';

// Runs as a one-shot step before the API starts: the `migrate` compose service
// and the API Deployment's initContainer on Kubernetes.
const dataSource = await createDataSource().initialize();
try {
  const applied = await dataSource.runMigrations({ transaction: 'each' });
  console.log(`Applied ${applied.length} migration(s).`);
} finally {
  await dataSource.destroy();
}
