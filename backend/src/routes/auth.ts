import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { verifyPassword } from '../lib/password';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: parseResult.error.issues } };
    }

    const { email, password } = parseResult.data;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
      reply.code(401);
      return { error: { message: 'Invalid credentials' } };
    }

    const passwordsMatch = verifyPassword(password, user.passwordHash);
    if (!passwordsMatch) {
      reply.code(401);
      return { error: { message: 'Invalid credentials' } };
    }

    await fastify.prisma.adminSession.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    await fastify.createAdminSession(reply, user.id);
    reply.code(204);
  });

  fastify.post('/auth/logout', async (request, reply) => {
    await fastify.destroyAdminSession(request, reply);
    reply.code(204);
  });

  fastify.get('/auth/session', { preHandler: fastify.authenticateAdmin }, async (request) => {
    return {
      user: request.adminUser,
    };
  });
};

export default authRoutes;
