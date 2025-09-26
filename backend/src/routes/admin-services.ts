import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const sortValues = ['name', 'price', 'duration', 'updatedAt'] as const;
const statusValues = ['all', 'active', 'inactive'] as const;

const listQuerySchema = z.object({
  query: z.string().trim().max(120).optional().default(''),
  status: z.enum(statusValues).optional().default('all'),
  sort: z.enum(sortValues).optional().default('name'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12),
});

const serviceCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(1),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().optional().default(true),
});

const serviceUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const idParamsSchema = z.object({ id: z.string().min(1) });

function serializeService(service: any) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
    isActive: service.isActive,
    updatedAt: service.updatedAt instanceof Date ? service.updatedAt.toISOString() : service.updatedAt,
  };
}

const adminServicesRoutes: FastifyPluginAsync = async (fastify) => {
  // List with pagination and filters
  fastify.get('/admin/services', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
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

    const orderBy: any =
      sort === 'price'
        ? { priceCents: 'asc' }
        : sort === 'duration'
        ? { durationMinutes: 'asc' }
        : sort === 'updatedAt'
        ? { updatedAt: 'desc' }
        : { name: 'asc' };

    const [total, items] = await Promise.all([
      fastify.prisma.service.count({ where }),
      fastify.prisma.service.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    ]);

    return {
      items: items.map(serializeService),
      total,
      page,
      pageSize,
    };
  });

  // Create
  fastify.post('/admin/services', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const parsed = serviceCreateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: parsed.error.issues } };
    }

    const created = await fastify.prisma.service.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        durationMinutes: parsed.data.durationMinutes,
        priceCents: parsed.data.priceCents,
        isActive: parsed.data.isActive ?? true,
      },
    });

    reply.code(201);
    return serializeService(created);
  });

  // Update
  fastify.patch('/admin/services/:id', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params ?? {});
    if (!params.success) {
      reply.code(400);
      return { error: { message: 'Invalid parameters', details: params.error.issues } };
    }
    const body = serviceUpdateSchema.safeParse(request.body ?? {});
    if (!body.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: body.error.issues } };
    }

    try {
      const updated = await fastify.prisma.service.update({
        where: { id: params.data.id },
        data: {
          ...body.data,
        },
      });
      return serializeService(updated);
    } catch (error) {
      reply.code(404);
      return { error: { message: 'Service not found' } };
    }
  });

  // Delete
  fastify.delete('/admin/services/:id', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params ?? {});
    if (!params.success) {
      reply.code(400);
      return { error: { message: 'Invalid parameters', details: params.error.issues } };
    }
    try {
      await fastify.prisma.service.delete({ where: { id: params.data.id } });
      reply.code(204);
      return null as any;
    } catch (error) {
      reply.code(404);
      return { error: { message: 'Service not found' } };
    }
  });
};

export default adminServicesRoutes;

