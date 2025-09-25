import { createHash } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildServer, type AppServer } from '../server.js';

const adminUser = {
  id: 'user-admin-1',
  email: 'admin@barbershop.dev',
  role: 'ADMIN',
};

function mockSession(app: AppServer, token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return vi
    .spyOn(app.prisma.adminSession, 'findUnique')
    .mockResolvedValue({
      id: 'session-1',
      tokenHash,
      userId: adminUser.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: adminUser,
    } as any);
}

describe('Admin appointments endpoints', () => {
  let app: AppServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires authentication for admin list', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/appointments' });
    expect(response.statusCode).toBe(401);
  });

  it('returns appointments list for admins', async () => {
    const token = 'test-token';
    mockSession(app, token);

    const mockAppointments = [
      {
        id: 'appt-1',
        status: 'CONFIRMED',
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        clientPhone: '555-0100',
        notes: null,
        source: 'web',
        createdAt: new Date('2025-09-20T10:00:00Z'),
        updatedAt: new Date('2025-09-20T10:15:00Z'),
        service: {
          id: 'svc-1',
          name: 'Classic Cut',
          description: 'Desc',
          durationMinutes: 45,
          priceCents: 3000,
          isActive: true,
        },
        barber: {
          id: 'barber-1',
          name: 'Alex Fade',
        },
        slot: {
          id: 'slot-1',
          start: new Date('2025-09-25T16:00:00Z'),
          end: new Date('2025-09-25T16:45:00Z'),
        },
      },
    ];

    const findManySpy = vi
      .spyOn(app.prisma.appointment, 'findMany')
      .mockResolvedValue(mockAppointments as unknown as Awaited<ReturnType<typeof app.prisma.appointment.findMany>>);

    const response = await app.inject({
      method: 'GET',
      url: '/api/appointments',
      cookies: { admin_session: token },
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalled();
    const payload = response.json() as Array<{ id: string; status: string }>;
    expect(payload).toHaveLength(1);
    expect(payload[0].status).toBe('CONFIRMED');
  });

  it('updates appointment status when admin requested', async () => {
    const token = 'test-token-2';
    mockSession(app, token);

    const updatedAppointment = {
      id: 'appt-2',
      status: 'COMPLETED',
      clientName: 'John Doe',
      clientEmail: null,
      clientPhone: null,
      notes: null,
      source: 'web',
      createdAt: new Date('2025-09-21T12:00:00Z'),
      updatedAt: new Date('2025-09-21T13:00:00Z'),
      service: {
        id: 'svc-1',
        name: 'Classic Cut',
        description: null,
        durationMinutes: 45,
        priceCents: 3000,
        isActive: true,
      },
      barber: {
        id: 'barber-1',
        name: 'Alex Fade',
      },
      slot: {
        id: 'slot-1',
        start: new Date('2025-09-25T16:00:00Z'),
        end: new Date('2025-09-25T16:45:00Z'),
      },
    };

    const updateSpy = vi
      .spyOn(app.prisma.appointment, 'update')
      .mockResolvedValue(updatedAppointment as unknown as Awaited<ReturnType<typeof app.prisma.appointment.update>>);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/appointments/appt-2/status',
      payload: { status: 'COMPLETED' },
      cookies: { admin_session: token },
    });

    expect(response.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'appt-2' },
        data: { status: 'COMPLETED' },
      }),
    );

    const body = response.json() as { status: string };
    expect(body.status).toBe('COMPLETED');
  });

  it('returns 404 when updating unknown appointment', async () => {
    const token = 'test-token-3';
    mockSession(app, token);

    vi.spyOn(app.prisma.appointment, 'update').mockRejectedValue(new Error('not found'));

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/appointments/missing/status',
      payload: { status: 'CANCELLED' },
      cookies: { admin_session: token },
    });

    expect(response.statusCode).toBe(404);
  });
});