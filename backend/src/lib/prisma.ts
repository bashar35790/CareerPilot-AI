import { Prisma, PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from './logger';

type EventLogDefinition = { emit: 'event'; level: Prisma.LogLevel };

const logDefinitions: EventLogDefinition[] = env.isDevelopment
  ? [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ]
  : [
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ];

function createPrismaClient() {
  return new PrismaClient({ log: logDefinitions });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

prisma.$on('error', (event) => {
  logger.error('Prisma error', { message: event.message, target: event.target });
});

prisma.$on('warn', (event) => {
  logger.warn('Prisma warning', { message: event.message, target: event.target });
});

if (env.isDevelopment) {
  prisma.$on('query', (event) => {
    logger.info('Prisma query executed', {
      query: event.query,
      durationMs: event.duration,
    });
  });
}

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('PostgreSQL connection established');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL connection closed');
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, disconnecting from PostgreSQL`);
  await disconnectDatabase();
  process.exit(0);
}

if (!env.isTest) {
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}
