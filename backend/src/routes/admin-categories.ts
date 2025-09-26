import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const listQuerySchema = z.object({
  query: z.string().trim().max(120).optional().default(''),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  sort: z.enum(['name', 'sortOrder', 'updatedAt']).optional().default('sortOrder'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12),
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const idParamsSchema = z.object({ id: z.string().min(1) });

function serializeCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}

const adminCategoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/categories', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: { message: 'Invalid query', details: parsed.error.issues } };
    }
    const { query, status, sort, page, pageSize } = parsed.data;

    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const orderBy: any = sort === 'name' ? { name: 'asc' } : sort === 'updatedAt' ? { updatedAt: 'desc' } : { sortOrder: 'asc' };

    const [total, items] = await Promise.all([
      fastify.prisma.category.count({ where }),
      fastify.prisma.category.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { items: items.map(serializeCategory), total, page, pageSize };
  });

  fastify.post('/admin/categories', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: parsed.error.issues } };
    }
    const data = parsed.data;
    const slug = data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-');
    try {
      const created = await fastify.prisma.category.create({
        data: { name: data.name, slug, description: data.description ?? null, sortOrder: data.sortOrder ?? 0, isActive: data.isActive ?? true },
      });
      reply.code(201);
      return serializeCategory(created);
    } catch (e) {
      reply.code(409);
      return { error: { message: 'Category already exists' } };
    }
  });

  fastify.patch('/admin/categories/:id', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params ?? {});
    const body = updateSchema.safeParse(request.body ?? {});
    if (!params.success || !body.success) {
      reply.code(400);
      return { error: { message: 'Invalid request', details: (!params.success ? params.error.issues : body.error.issues) } };
    }
    try {
      const updated = await fastify.prisma.category.update({ where: { id: params.data.id }, data: body.data });
      return serializeCategory(updated);
    } catch (e) {
      reply.code(404);
      return { error: { message: 'Category not found' } };
    }
  });

  fastify.delete('/admin/categories/:id', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params ?? {});
    if (!params.success) {
      reply.code(400);
      return { error: { message: 'Invalid parameters', details: params.error.issues } };
    }
    try {
      await fastify.prisma.category.delete({ where: { id: params.data.id } });
      reply.code(204);
      return null as any;
    } catch (e) {
      reply.code(404);
      return { error: { message: 'Category not found' } };
    }
  });
};

export default adminCategoriesRoutes;

