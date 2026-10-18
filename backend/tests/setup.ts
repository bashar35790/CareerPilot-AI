import { TEST_DATABASE_URL } from './test-env';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;

if (!TEST_DATABASE_URL.includes('test')) {
  throw new Error(
    'Integration tests refuse to run: DATABASE_URL must target an isolated test database/schema.'
  );
}
