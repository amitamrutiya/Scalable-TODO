#!/usr/bin/env node
/**
 * Test RDS Connectivity
 * Run this before starting the server to verify RDS connection
 */

const { Client } = require('pg');
const { execSync } = require('child_process');

const RDS_HOST = 'database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_DB = 'todoapp';
const RDS_USER = 'postgres';
const REGION = 'us-east-1';

async function testRDSConnection() {
  console.log('🔍 Testing RDS Connectivity...\n');
  
  try {
    // Step 1: Generate auth token
    console.log('Step 1: Generating IAM auth token...');
    const authToken = execSync(
      `aws rds generate-db-auth-token --hostname ${RDS_HOST} --port ${RDS_PORT} --username ${RDS_USER} --region ${REGION}`,
      { encoding: 'utf8' }
    ).trim();
    console.log('✅ Token generated\n');
    
    // Step 2: Connect to RDS (try postgres first, then todoapp)
    console.log('Step 2: Connecting to RDS...');
    
    // First try 'postgres' database (always exists)
    const adminClient = new Client({
      host: RDS_HOST,
      port: RDS_PORT,
      database: 'postgres', // Connect to default first
      user: RDS_USER,
      password: authToken,
      ssl: {
        rejectUnauthorized: false,
        ca: require('fs').readFileSync('/tmp/rds-combined-ca-bundle.pem').toString(),
      },
    });
    
    await adminClient.connect();
    console.log('✅ Connected to RDS (postgres database)\n');
    
    // Check if todoapp database exists
    console.log('Step 3: Checking for todoapp database...');
    const dbResult = await adminClient.query(`
      SELECT EXISTS (
        SELECT FROM pg_database WHERE datname = 'todoapp'
      );
    `);
    
    if (!dbResult.rows[0].exists) {
      console.log('⚠️ Database "todoapp" does not exist!');
      console.log('Creating database...');
      await adminClient.query('CREATE DATABASE todoapp;');
      console.log('✅ Database "todoapp" created\n');
    } else {
      console.log('✅ Database "todoapp" exists\n');
    }
    
    await adminClient.end();
    
    // Now connect to todoapp
    console.log('Step 4: Connecting to todoapp database...');
    const client = new Client({
      host: RDS_HOST,
      port: RDS_PORT,
      database: RDS_DB,
      user: RDS_USER,
      password: authToken,
      ssl: {
        rejectUnauthorized: false,
        ca: require('fs').readFileSync('/tmp/rds-combined-ca-bundle.pem').toString(),
      },
    });
    
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // Step 5: Test query
    console.log('Step 5: Running test query...');
    const result = await client.query('SELECT NOW() as time, current_database() as db');
    console.log(`✅ Query successful!`);
    console.log(`   Server Time: ${result.rows[0].time}`);
    console.log(`   Database: ${result.rows[0].db}\n`);
    
    // Step 6: Check if schema exists
    console.log('Step 6: Checking schema...');
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log('✅ Schema already initialized\n');
    } else {
      console.log('⚠️ Schema not found. Run: npm run init:rds\n');
    }
    
    await client.end();
    
    console.log('🎉 All checks passed! You can start the server now.');
    console.log('');
    console.log('Start command:');
    console.log('  ./connect-rds.sh');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify AWS credentials: aws sts get-caller-identity');
    console.error('  2. Check IAM permissions for rds-db:connect');
    console.error('  3. Verify RDS security group allows your IP');
    console.error('  4. Ensure IAM database authentication is enabled');
    process.exit(1);
  }
}

testRDSConnection();