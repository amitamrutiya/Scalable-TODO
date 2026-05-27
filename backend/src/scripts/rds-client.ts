import { Client } from 'pg';
import fs from 'fs';
import { getLogger } from '../utils/logger';

const logger = getLogger('rds-client');

/**
 * Create a PostgreSQL client for RDS with IAM authentication
 * This bypasses connection string parsing issues with auth tokens
 */
export function createRDSClient(
  host: string,
  port: number,
  database: string,
  user: string,
  password: string
): Client {
  const caCertPath = '/tmp/rds-combined-ca-bundle.pem';
  
  const client = new Client({
    host,
    port,
    database,
    user,
    password,
    ssl: {
      rejectUnauthorized: false, // Allow self-signed certs for RDS
      ...(fs.existsSync(caCertPath) ? {
        ca: fs.readFileSync(caCertPath).toString(),
      } : {}),
    },
    connectionTimeoutMillis: 10000,
  });

  return client;
}

/**
 * Test RDS connection and return client
 */
export async function connectRDS(options: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): Promise<Client> {
  const client = createRDSClient(
    options.host,
    options.port,
    options.database,
    options.user,
    options.password
  );

  try {
    await client.connect();
    logger.info('Connected to RDS successfully');
    return client;
  } catch (error) {
    logger.error('Failed to connect to RDS', { error: (error as Error).message });
    throw error;
  }
}