import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import prismaPlugin from './plugins/prisma.js';
import adminAuthPlugin from './plugins/admin-auth.js';
import servicesRoutes from './routes/services.js';
import barbersRoutes from './routes/barbers.js';
import availabilityRoutes from './routes/availability.js';
import appointmentsRoutes from './routes/appointments.js';
import authRoutes from './routes/auth.js';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

const buildServer = () => {
  const app = fastify({
    logger: true,
  });

  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(cookie);
  app.register(prismaPlugin);
  app.register(adminAuthPlugin);

  app.register(async (instance) => {
    instance.register(servicesRoutes, { prefix: '/api' });
    instance.register(barbersRoutes, { prefix: '/api' });
    instance.register(availabilityRoutes, { prefix: '/api' });
    instance.register(appointmentsRoutes, { prefix: '/api' });
    instance.register(authRoutes, { prefix: '/api' });
  });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
};

const start = async () => {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  const app = buildServer();

  try {
    await app.listen({ port, host });
    app.log.info(`API running on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export type AppServer = ReturnType<typeof buildServer>;
export { buildServer };
