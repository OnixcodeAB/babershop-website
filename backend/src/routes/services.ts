import type { FastifyPluginAsync } from 'fastify';

const servicesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/services', async () => {
    const services = await fastify.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return services;
  });
};

export default servicesRoutes;
