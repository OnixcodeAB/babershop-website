import type { FastifyPluginAsync } from 'fastify';

function serializeService(service: any) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
    isActive: service.isActive,
    categories: (service.categories ?? []).map((c: any) => ({ id: c.id, name: c.name })),
  };
}

const servicesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/services', async () => {
    const services = await fastify.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { categories: true },
    });

    return services.map(serializeService);
  });
};

export default servicesRoutes;
