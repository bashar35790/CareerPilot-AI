import { prisma } from '../../src/lib/prisma';

export async function deleteUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
