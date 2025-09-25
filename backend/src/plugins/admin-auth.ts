import '@fastify/cookie';
import { createHash, randomBytes } from 'node:crypto';
import fastifyPlugin from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_HOURS = 12;
const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    createAdminSession: (reply: FastifyReply, userId: string) => Promise<void>;
    destroyAdminSession: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    adminUser?: {
      id: string;
      email: string;
      role: string;
    };
    adminSessionToken?: string;
  }
}

const adminAuthPlugin: FastifyPluginAsync = async (fastify) => {
  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';

  fastify.decorate('createAdminSession', async (reply: FastifyReply, userId: string) => {
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await fastify.prisma.adminSession.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: SESSION_TTL_MS / 1000,
    });
  });

  fastify.decorate('destroyAdminSession', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.[SESSION_COOKIE];
    if (token) {
      const tokenHash = hashSessionToken(token);
      await fastify.prisma.adminSession.deleteMany({ where: { tokenHash } });
    }

    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  });

  fastify.decorate('authenticateAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.[SESSION_COOKIE];
    if (!token) {
      reply.code(401);
      throw new Error('Unauthorized');
    }

    const tokenHash = hashSessionToken(token);
    const session = await fastify.prisma.adminSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      if (session) {
        await fastify.prisma.adminSession.delete({ where: { id: session.id } });
      }
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      reply.code(401);
      throw new Error('Unauthorized');
    }

    if (session.user.role !== 'ADMIN') {
      reply.code(403);
      throw new Error('Forbidden');
    }

    request.adminUser = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
    request.adminSessionToken = token;
  });
};

export default fastifyPlugin(adminAuthPlugin);
