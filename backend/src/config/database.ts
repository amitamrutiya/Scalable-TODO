import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import { env } from './env';
import { getLogger } from '../utils/logger';

const logger = getLogger('database');

// RDS configuration from environment
const rdsHost = process.env.RDS_HOSTNAME;
const rdsPort = parseInt(process.env.RDS_PORT || '5432');
const rdsDb = process.env.RDS_DB_NAME || 'todoapp';
const rdsUser = process.env.RDS_USERNAME || 'postgres';
const rdsToken = process.env.RDS_AUTH_TOKEN;

let poolConfig: PoolConfig;

if (rdsHost && rdsToken) {
  // Use direct configuration for RDS IAM authentication
  // (Avoids connection string parsing issues with auth tokens)
  logger.info('Connecting to Amazon RDS with IAM authentication');
  
  const caCertPath = '/tmp/rds-combined-ca-bundle.pem';
  
  poolConfig = {
    host: rdsHost,
    port: rdsPort,
    database: rdsDb,
    user: rdsUser,
    password: rdsToken,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
      ...(fs.existsSync(caCertPath) ? {
        ca: fs.readFileSync(caCertPath).toString(),
      } : {}),
    },
  };
} else {
  // Use connection string for local/database URL config
  poolConfig = {
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  
  // Local database SSL (for Docker/test environments)
  if (env.DATABASE_URL.includes('rds.amazonaws.com')) {
    const caCertPath = '/tmp/rds-combined-ca-bundle.pem';
    
    if (fs.existsSync(caCertPath)) {
      poolConfig.ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caCertPath).toString(),
      };
      logger.info('RDS SSL enabled with CA certificate');
    } else {
      poolConfig.ssl = { rejectUnauthorized: false };
      logger.warn('RDS detected but CA certificate not found');
    }
  }
}

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