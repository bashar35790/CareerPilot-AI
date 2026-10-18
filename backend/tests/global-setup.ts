import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './test-env';

export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
