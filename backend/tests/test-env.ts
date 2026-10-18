export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://careerpilot_user:careerpilot_password@localhost:5432/careerpilot_db?schema=careerpilot_test';

export const TEST_SCHEMA = 'careerpilot_test';
