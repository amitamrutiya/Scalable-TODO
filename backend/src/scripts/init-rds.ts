#!/usr/bin/env node
/**
 * Initialize RDS Database Schema using direct connection
 * Bypasses connection string parsing issues with RDS auth tokens
 */

import { connectRDS } from './rds-client';
import { getLogger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const logger = getLogger('init-rds');

async function initializeDatabase(): Promise<void> {
  const rdsHost = process.env.RDS_HOSTNAME || 'database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com';
  const rdsPort = parseInt(process.env.RDS_PORT || '5432');
  const rdsDb = process.env.RDS_DB_NAME || 'todoapp';
  const rdsUser = process.env.RDS_USERNAME || 'postgres';
  const rdsToken = process.env.RDS_AUTH_TOKEN || '';

  if (!rdsToken) {
    logger.error('❌ RDS_AUTH_TOKEN environment variable is required');
    logger.info('Generate with: aws rds generate-db-auth-token --hostname HOST --port 5432 --username USER --region us-east-1');
    process.exit(1);
  }

  try {
    logger.info('Starting RDS database initialization...');
    logger.info(`Host: ${rdsHost}`);
    logger.info(`Database: ${rdsDb}`);
    
    // Connect using direct parameters (avoids connection string parsing issues)
    const client = await connectRDS({
      host: rdsHost,
      port: rdsPort,
      database: rdsDb,
      user: rdsUser,
      password: rdsToken,
    });

    // Read schema file
    const schemaPath = path.resolve(__dirname, '../../database/init.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Read and execute entire schema as a single transaction
    // This handles functions with $$ delimiters correctly
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    logger.info('Executing schema...');
    
    try {
      await client.query('BEGIN;');
      await client.query(schemaSQL);
      await client.query('COMMIT;');
      logger.info('✅ Schema executed successfully');
    } catch (error) {
      await client.query('ROLLBACK;');
      const err = error as Error;
      if (err.message.includes('already exists')) {
        logger.info('Schema objects already exist (skipping)');
      } else {
        throw error;
      }
    }
    
    await client.end();
    
    logger.info('✅ Database schema initialized successfully');
    
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();