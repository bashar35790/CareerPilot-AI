import request from 'supertest';
import app from '../../src/index';

export const TEST_PASSWORD = 'Password123!';

export type TestAgent = ReturnType<typeof request.agent>;

export interface TestUser {
  agent: TestAgent;
  id: string;
  email: string;
}

let userCounter = 0;

export async function registerTestUser(prefix = 'user'): Promise<TestUser> {
  userCounter += 1;
  const email = `${prefix}.${Date.now()}.${userCounter}@example.com`;
  const agent = request.agent(app);

  const response = await agent
    .post('/api/v1/auth/register')
    .send({ fullName: `Test ${prefix}`, email, password: TEST_PASSWORD });

  if (response.status !== 201) {
    throw new Error(
      `Failed to register test user (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  return { agent, id: response.body.data.user.id, email };
}
