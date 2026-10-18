import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://eval:eval@localhost:5432/careerpilot_eval';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'evaluation_only_access_secret_key';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'evaluation_only_refresh_secret_key';
