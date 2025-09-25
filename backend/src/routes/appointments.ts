import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const appointmentStatusValues = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const appointmentStatusEnum = z.enum(appointmentStatusValues);

const appointmentSchema = z.object({
  clientName: z.string().min(1, 'clientName is required').max(120),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().min(7).max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  serviceId: z.string().min(1, 'serviceId is required'),
  slotId: z.string().min(1, 'slotId is required'),
  source: z.string().max(50).optional().default('web'),
});

const appointmentLookupParams = z.object({
  id: z.string().min(1, 'id is required'),
});

const updateStatusSchema = z.object({
  status: appointmentStatusEnum,
});

const appointmentListQuery = z.object({
  status: appointmentStatusEnum.optional(),
});

function serializeAppointment(appointment: any) {
  if (!appointment.service || !appointment.slot) {
    throw new Error('Appointment is missing required relations');
  }

  return {
    id: appointment.id,
    status: appointment.status,
    clientName: appointment.clientName,
    clientEmail: appointment.clientEmail,
    clientPhone: appointment.clientPhone,
    notes: appointment.notes,
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      description: appointment.service.description,
      durationMinutes: appointment.service.durationMinutes,
      priceCents: appointment.service.priceCents,
      isActive: appointment.service.isActive,
    },
    barber: appointment.barber
      ? {
          id: appointment.barber.id,
          name: appointment.barber.name,
        }
      : null,
    slot: {
      id: appointment.slot.id,
      start:
        appointment.slot.start instanceof Date
          ? appointment.slot.start.toISOString()
          : appointment.slot.start,
      end:
        appointment.slot.end instanceof Date ? appointment.slot.end.toISOString() : appointment.slot.end,
    },
    createdAt: appointment.createdAt instanceof Date ? appointment.createdAt.toISOString() : appointment.createdAt,
    updatedAt: appointment.updatedAt instanceof Date ? appointment.updatedAt.toISOString() : appointment.updatedAt,
    source: appointment.source,
  };
}

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
    return serializeAppointment(appointment);
  });

  fastify.get('/appointments', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const parseQuery = appointmentListQuery.safeParse(request.query ?? {});
    if (!parseQuery.success) {
      reply.code(400);
      return { error: { message: 'Invalid query', details: parseQuery.error.issues } };
    }

    const { status } = parseQuery.data;

    const appointments = await fastify.prisma.appointment.findMany({
      where: {
        status: status ?? undefined,
      },
      orderBy: {
        slot: {
          start: 'asc',
        },
      },
      include: {
        service: true,
        barber: true,
        slot: true,
      },
    });

    return appointments.map(serializeAppointment);
  });

  fastify.get('/appointments/:id', async (request, reply) => {
    const parseParams = appointmentLookupParams.safeParse(request.params ?? {});
    if (!parseParams.success) {
      reply.code(400);
      return { error: { message: 'Invalid parameters', details: parseParams.error.issues } };
    }

    const { id } = parseParams.data;

    const appointment = await fastify.prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        barber: true,
        slot: true,
      },
    });

    if (!appointment) {
      reply.code(404);
      return { error: { message: 'Appointment not found' } };
    }

    return serializeAppointment(appointment);
  });

  fastify.patch('/appointments/:id/status', { preHandler: fastify.authenticateAdmin }, async (request, reply) => {
    const parseParams = appointmentLookupParams.safeParse(request.params ?? {});
    if (!parseParams.success) {
      reply.code(400);
      return { error: { message: 'Invalid parameters', details: parseParams.error.issues } };
    }

    const parseBody = updateStatusSchema.safeParse(request.body ?? {});
    if (!parseBody.success) {
      reply.code(400);
      return { error: { message: 'Invalid payload', details: parseBody.error.issues } };
    }

    const { id } = parseParams.data;
    const { status } = parseBody.data;

    try {
      const updated = await fastify.prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          service: true,
          barber: true,
          slot: true,
        },
      });

      return serializeAppointment(updated);
    } catch (error) {
      reply.code(404);
      return { error: { message: 'Appointment not found' } };
    }
  });
};

export default appointmentsRoutes;
