import { pool } from '@/config/database';
import { getLogger } from '@/utils/logger';

const logger = getLogger('test-setup');

/**
 * Initialize test database schema by running init.sql.
 * Called once before all tests.
 */
export async function initializeTestDatabase(): Promise<void> {
  logger.info('Initializing test database schema');
  
  const fs = require('fs');
  const path = require('path');
  // Resolve from project root (jest runs from backend/)
  const sqlFile = path.resolve(process.cwd(), 'database/init.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split into individual statements and execute them
  const statements = sql
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
  
  for (const statement of statements) {
    try {
      await pool.query(statement + ';');
    } catch (error) {
      // Ignore "already exists" errors - they're expected for CREATE statements
      const err = error as Error;
      if (!err.message?.includes('already exists')) {
        logger.warn('SQL init warning', { error: err.message });
      }
    }
  }
  
  logger.info('Test database initialized');
}

/**
 * Clean all data from test tables. Does not drop tables.
 * Use this in beforeEach/beforeAll for isolated tests.
 */
export async function cleanupTestData(): Promise<void> {
  // Delete in correct order to respect foreign keys
  await pool.query('DELETE FROM todo_tags;');
  await pool.query('DELETE FROM tags;');
  await pool.query('DELETE FROM todos;');
  await pool.query('DELETE FROM users;');
}

/**
 * Close the database pool. Call after all tests.
 */
export async function closeTestDatabase(): Promise<void> {
  // Pool is closed by Jest's forceExit. Explicitly ending it here
  // would break subsequent test suites when running with --runInBand.
}
