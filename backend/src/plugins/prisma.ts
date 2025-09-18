import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export type PrismaFastifyPluginOptions = {
  logQueries?: boolean;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin = fastifyPlugin(async (fastify, opts: PrismaFastifyPluginOptions = {}) => {
  const prisma = new PrismaClient({
    log: opts.logQueries ? ['query', 'info', 'warn', 'error'] : ['error', 'warn'],
  });

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

export default prismaPlugin;
