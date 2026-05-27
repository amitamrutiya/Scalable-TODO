import { initializeTestDatabase, closeTestDatabase } from './helpers/database';
import { getLogger } from '@/utils/logger';

const logger = getLogger('test-setup');

beforeAll(async () => {
  logger.info('Setting up test environment');
  await initializeTestDatabase();
});

afterAll(async () => {
  logger.info('Tearing down test environment');
  await closeTestDatabase();
});
