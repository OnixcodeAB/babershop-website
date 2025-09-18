import type { FastifyPluginAsync } from 'fastify';
import { addDays, startOfDay } from 'date-fns';
import { z } from 'zod';

const querySchema = z.object({
  date: z.string().min(1, 'date is required'),
  serviceId: z.string().optional(),
  barberId: z.string().optional(),
});

const availabilityRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/availability', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: { message: 'Invalid query', details: parsed.error.issues } };
    }

    const { date, serviceId, barberId } = parsed.data;
    const dayStart = startOfDay(new Date(`${date}T00:00:00Z`));
    const dayEnd = addDays(dayStart, 1);

    const slots = await fastify.prisma.timeSlot.findMany({
      where: {
        start: {
          gte: dayStart,
          lt: dayEnd,
        },
        isBlocked: false,
        ...(barberId ? { barberId } : {}),
      },
      include: {
        barber: {
          include: {
            services: {
              select: { id: true },
            },
          },
        },
        bookings: {
          where: {
            status: {
              not: 'CANCELLED',
            },
          },
        },
      },
      orderBy: { start: 'asc' },
    });

    const availableSlots = slots
      .filter((slot) => {
        if (slot.bookings.length > 0) {
          return false;
        }
        if (serviceId && slot.barber) {
          return slot.barber.services.some((service) => service.id === serviceId);
        }
        return true;
      })
      .map((slot) => ({
        slotId: slot.id,
        barberId: slot.barberId,
        barberName: slot.barber?.name ?? null,
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }));

    return availableSlots;
  });
};

export default availabilityRoutes;
