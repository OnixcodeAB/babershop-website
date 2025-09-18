import type { FastifyPluginAsync } from 'fastify';

const barbersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/barbers', async (request) => {
    const { serviceId } = request.query as { serviceId?: string };

    return fastify.prisma.barber.findMany({
      where: serviceId
        ? {
            services: {
              some: { id: serviceId },
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      include: {
        services: {
          select: { id: true, name: true, durationMinutes: true, priceCents: true },
        },
      },
    });
  });
};

export default barbersRoutes;
