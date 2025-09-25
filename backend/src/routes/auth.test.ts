import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AppServer } from '../server.js';
import { buildServer } from '../server.js';
import { hashPassword } from '../lib/password.js';

describe('Admin auth routes', () => {
  let app: AppServer;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    process.env.NODE_ENV = originalEnv;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid login payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'invalid', password: 'short' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects non-admin credentials', async () => {
    vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue(null as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@barbershop.dev', password: 'change-me' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('creates session cookie for admin login and allows session lookup', async () => {
    const adminUser = {
      id: 'user-admin-1',
      email: 'admin@barbershop.dev',
      role: 'ADMIN',
      passwordHash: hashPassword('change-me'),
      magicLinkTokenHash: null,
      tokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const storedSessions: Array<{ tokenHash: string; id: string; expiresAt: Date }> = [];

    vi.spyOn(app.prisma.user, 'findUnique').mockImplementation(async ({ where }) => {
      return where.email === adminUser.email ? (adminUser as any) : null;
    });

    vi.spyOn(app.prisma.adminSession, 'deleteMany').mockResolvedValue({ count: 0 });

    vi.spyOn(app.prisma.adminSession, 'create').mockImplementation(async ({ data }) => {
      const record = {
        id: `session-${storedSessions.length + 1}`,
        tokenHash: data.tokenHash,
        userId: data.userId,
        createdAt: data.createdAt ?? new Date(),
        expiresAt: data.expiresAt,
      };
      storedSessions.push(record);
      return record as any;
    });

    vi.spyOn(app.prisma.adminSession, 'findUnique').mockImplementation(async ({ where }) => {
      const match = storedSessions.find((session) => session.tokenHash === where.tokenHash);
      if (!match) {
        return null;
      }
      return {
        ...match,
        user: adminUser,
      } as any;
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: adminUser.email, password: 'change-me' },
    });

    expect(loginResponse.statusCode).toBe(204);
    const setCookie = loginResponse.cookies.find((cookie) => cookie.name === 'admin_session');
    expect(setCookie).toBeTruthy();

    const sessionResponse = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: {
        admin_session: setCookie?.value ?? '',
      },
    });

    expect(sessionResponse.statusCode).toBe(200);
    const payload = sessionResponse.json() as { user: { email: string } };
    expect(payload.user.email).toBe(adminUser.email);
  });

  it('blocks session endpoint without cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/session' });
    expect(response.statusCode).toBe(401);
  });
});
