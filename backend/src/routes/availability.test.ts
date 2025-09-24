import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildServer, type AppServer } from '../server.js';

describe('GET /api/availability timezone handling', () => {
  const originalTz = process.env.TZ;
  let app: AppServer;

  beforeAll(async () => {
    process.env.TZ = 'America/Los_Angeles';
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    process.env.TZ = originalTz;
  });

  it('keeps slot start times on the requested calendar date for non-UTC offsets', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        barberId: 'barber-1',
        start: new Date('2025-09-25T16:00:00.000Z'),
        end: new Date('2025-09-25T16:45:00.000Z'),
        isBlocked: false,
        createdAt: new Date('2025-09-01T00:00:00.000Z'),
        updatedAt: new Date('2025-09-01T00:00:00.000Z'),
        barber: {
          id: 'barber-1',
          name: 'Test Barber',
          services: [{ id: 'svc-1' }],
        },
        bookings: [],
      },
    ];

    const findManySpy = vi
      .spyOn(app.prisma.timeSlot, 'findMany')
      .mockResolvedValue(mockSlots as unknown as Awaited<ReturnType<typeof app.prisma.timeSlot.findMany>>);

    const response = await app.inject({
      method: 'GET',
      url: '/api/availability?date=2025-09-25&serviceId=svc-1',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body) as Array<{ start: string }>;
    expect(payload).toHaveLength(1);
    expect(payload[0].start.startsWith('2025-09-25')).toBe(true);

    const lastCall = findManySpy.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeTruthy();
    const gteIso = lastCall.where.start.gte.toISOString();
    const ltIso = lastCall.where.start.lt.toISOString();
    expect(gteIso.startsWith('2025-09-25')).toBe(true);
    expect(ltIso.startsWith('2025-09-26')).toBe(true);

    findManySpy.mockRestore();
  });
});
