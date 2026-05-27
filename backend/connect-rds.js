#!/usr/bin/env node
/**
 * Production RDS Connection Script
 * Uses compiled JavaScript (dist/) to avoid ts-node issues
 */

const { execSync } = require('child_process');

const RDS_HOST = 'database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_DB = 'todoapp';
const RDS_USER = 'postgres';
const REGION = 'us-east-1';

async function startBackend() {
  console.log('🚀 Starting Todo Backend with Amazon RDS\n');

  try {
    // Step 1: Generate auth token
    console.log('🔑 Generating RDS IAM auth token...');
    const authToken = execSync(
      `aws rds generate-db-auth-token --hostname ${RDS_HOST} --port ${RDS_PORT} --username ${RDS_USER} --region ${REGION}`,
      { encoding: 'utf8' }
    ).trim();
    console.log('✅ Auth token generated\n');

    // Step 2: Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || '3000';
    process.env.RDS_HOSTNAME = RDS_HOST;
    process.env.RDS_PORT = String(RDS_PORT);
    process.env.RDS_DB_NAME = RDS_DB;
    process.env.RDS_USERNAME = RDS_USER;
    process.env.RDS_AUTH_TOKEN = authToken;
    process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(48).toString('base64');
    process.env.LOG_LEVEL = 'info';

    // Step 3: Initialize schema
    console.log('📊 Ensuring database schema...');
    try {
      const { initializeDatabase } = require('./dist/scripts/init-rds');
      await initializeDatabase();
    } catch (err) {
      console.log('⚠️  Schema initialization skipped:', err.message);
    }

    // Step 4: Start server
    console.log('\n🌐 Starting server...');
    console.log(`   Port: ${process.env.PORT}`);
    console.log(`   Database: ${RDS_DB}@${RDS_HOST}`);
    console.log(`   API: http://localhost:${process.env.PORT}/api/v1\n`);

    require('./dist/index');

  } catch (error) {
    console.error('\n❌ Failed to start:', error.message);
    process.exit(1);
  }
}

startBackend();