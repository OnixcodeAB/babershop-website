import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const appointmentSchema = z.object({
  clientName: z.string().min(1, 'clientName is required').max(120),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().min(7).max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  serviceId: z.string().min(1, 'serviceId is required'),
  slotId: z.string().min(1, 'slotId is required'),
  source: z.string().max(50).optional().default('web'),
});

const appointmentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/appointments', async (request, reply) => {
    const parseResult = appointmentSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: parseResult.error.issues } };
    }

    const payload = parseResult.data;

    const [service, slot] = await Promise.all([
      fastify.prisma.service.findUnique({
        where: { id: payload.serviceId },
      }),
      fastify.prisma.timeSlot.findUnique({
        where: { id: payload.slotId },
        include: {
          barber: true,
          bookings: {
            where: {
              status: {
                not: 'CANCELLED',
              },
            },
          },
        },
      }),
    ]);

    if (!service || !service.isActive) {
      reply.code(404);
      return { error: { message: 'Service not found or inactive' } };
    }

    if (!slot || slot.isBlocked) {
      reply.code(404);
      return { error: { message: 'Time slot not available' } };
    }

    if (slot.bookings.length > 0) {
      reply.code(409);
      return { error: { message: 'Time slot already booked' } };
    }

    if (!slot.barber) {
      reply.code(500);
      return { error: { message: 'Time slot is not linked to a barber' } };
    }

    const appointment = await fastify.prisma.appointment.create({
      data: {
        clientName: payload.clientName,
        clientEmail: payload.clientEmail ?? null,
        clientPhone: payload.clientPhone ?? null,
        notes: payload.notes ?? null,
        status: 'PENDING',
        source: payload.source,
        serviceId: service.id,
        barberId: slot.barber.id,
        slotId: slot.id,
      },
      include: {
        service: true,
        barber: true,
        slot: true,
      },
    });

    reply.code(201);
    return {
      id: appointment.id,
      status: appointment.status,
      clientName: appointment.clientName,
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
      },
      barber: appointment.barber
        ? {
            id: appointment.barber.id,
            name: appointment.barber.name,
          }
        : null,
      slot: {
        id: appointment.slot.id,
        start: appointment.slot.start,
        end: appointment.slot.end,
      },
    };
  });
};

export default appointmentsRoutes;

