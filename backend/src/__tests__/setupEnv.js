// This file runs BEFORE ts-jest compiles TypeScript, so it must be plain JS.
// It sets environment variables so that when config/env.ts and config/database.ts
// are loaded during import resolution, they use the test database.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test';
