import { Pool, PoolConfig } from 'pg';
import { env } from './env';
import { getLogger } from '../utils/logger';

const logger = getLogger('database');

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(env.DATABASE_URL.includes('rds.amazonaws.com') && {
    ssl: { rejectUnauthorized: false },
  }),
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: (error as Error).message });
    return false;
  }
}
