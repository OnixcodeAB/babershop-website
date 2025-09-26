import type { FastifyPluginAsync } from 'fastify';

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/categories', async () => {
    const categories = await fastify.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    }));
  });
};

export default categoriesRoutes;

