import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from '../src/lib/password.ts';

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type SeedCategory = { name: string; sortOrder: number };

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Haircuts', sortOrder: 0 },
  { name: 'Beard Care', sortOrder: 1 },
  { name: 'Shaves', sortOrder: 2 },
  { name: 'Color', sortOrder: 3 },
  { name: 'Other Services', sortOrder: 99 },
];

function inferCategoryName(serviceName: string): string {
  const value = serviceName.toLowerCase();
  if (value.includes('cut') || value.includes('fade')) return 'Haircuts';
  if (value.includes('beard') || value.includes('mustache')) return 'Beard Care';
  if (value.includes('shave')) return 'Shaves';
  if (value.includes('color') || value.includes('tint')) return 'Color';
  return 'Other Services';
}

async function main() {
  // 1) Ensure default categories exist
  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map(async ({ name, sortOrder }) => {
      const slug = slugify(name);
      const record = await prisma.category.upsert({
        where: { slug },
        update: { name, sortOrder, isActive: true },
        create: { name, slug, sortOrder, isActive: true },
      });
      return record;
    })
  );

  const byName = new Map(categories.map((c) => [c.name, c] as const));

  // 2) Seed sample services (idempotent by name)
  const SAMPLE_SERVICES = [
    { name: 'Classic Cut', description: 'Timeless clipper and scissor work with hot towel finish.', durationMinutes: 45, priceCents: 3000, category: 'Haircuts' },
    { name: 'Beard Trim', description: 'Precision beard sculpting with hot towel and oils.', durationMinutes: 30, priceCents: 2000, category: 'Beard Care' },
    { name: 'Hot Towel Shave', description: 'Old-school straight-razor shave with modern precision.', durationMinutes: 30, priceCents: 2500, category: 'Shaves' },
    { name: 'Kids Cut', description: 'Fresh styles for younger guests.', durationMinutes: 30, priceCents: 2500, category: 'Haircuts' },
    { name: 'Color Refresh', description: 'Subtle blends or bold statements tailored to your vibe.', durationMinutes: 60, priceCents: 5000, category: 'Color' },
  ] as const;

  const serviceIdByName = new Map<string, string>();
  for (const s of SAMPLE_SERVICES) {
    const cat = byName.get(s.category);
    if (!cat) continue;
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      const updated = await prisma.service.update({
        where: { id: existing.id },
        data: {
          description: s.description,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          isActive: true,
          categories: { set: [{ id: cat.id }] },
        },
      });
      serviceIdByName.set(updated.name, updated.id);
    } else {
      const created = await prisma.service.create({
        data: {
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          isActive: true,
          categories: { connect: [{ id: cat.id }] },
        },
      });
      serviceIdByName.set(created.name, created.id);
    }
  }

  // 3) Backfill existing services without categories (heuristic)
  const services = await prisma.service.findMany({ include: { categories: true } });
  for (const svc of services) {
    if (svc.categories.length > 0) continue;
    const catName = inferCategoryName(svc.name);
    const cat = byName.get(catName);
    if (!cat) continue;
    await prisma.service.update({
      where: { id: svc.id },
      data: { categories: { set: [{ id: cat.id }] } },
    });
  }

  // 4) Seed sample barbers and link to services
  const SAMPLE_BARBERS: Array<{ name: string; bio?: string; services: string[] }> = [
    {
      name: 'Alex Fade',
      bio: 'Fade specialist with a clean, modern touch.',
      services: ['Classic Cut', 'Beard Trim', 'Kids Cut'],
    },
    {
      name: 'Maria Blend',
      bio: 'Precision cuts and color blending wizardry.',
      services: ['Classic Cut', 'Color Refresh'],
    },
    {
      name: 'Omar Razor',
      bio: 'Traditional shaves and beard craftsmanship.',
      services: ['Hot Towel Shave', 'Beard Trim'],
    },
  ];

  for (const b of SAMPLE_BARBERS) {
    const serviceIds = b.services
      .map((n) => serviceIdByName.get(n))
      .filter((id): id is string => Boolean(id));

    const existing = await prisma.barber.findFirst({ where: { name: b.name } });
    if (existing) {
      await prisma.barber.update({
        where: { id: existing.id },
        data: {
          bio: b.bio ?? existing.bio,
          services: serviceIds.length > 0 ? { set: serviceIds.map((id) => ({ id })) } : undefined,
        },
      });
    } else {
      await prisma.barber.create({
        data: {
          name: b.name,
          bio: b.bio ?? null,
          services: serviceIds.length > 0 ? { connect: serviceIds.map((id) => ({ id })) } : undefined,
        },
      });
    }
  }

  // 5) Seed a development admin user + session (cookie-based)
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin12345';
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', passwordHash: hashPassword(ADMIN_PASSWORD) },
    create: { email: ADMIN_EMAIL, role: 'ADMIN', passwordHash: hashPassword(ADMIN_PASSWORD) },
  });

  // Clear previous sessions for a clean dev token
  await prisma.adminSession.deleteMany({ where: { userId: adminUser.id } });

  const rawToken = `dev_${randomBytes(16).toString('hex')}`;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.adminSession.create({
    data: { tokenHash, userId: adminUser.id, expiresAt },
  });

  console.log('\nDev admin session generated. To sign in locally, set cookie:');
  console.log('admin_session=' + rawToken);
  console.log('(Expires in 7 days)');
  console.log(`Admin login: email=${ADMIN_EMAIL} password=${ADMIN_PASSWORD}`);

  console.log('\nSeed complete: categories ensured, sample services/barbers created, services backfilled, admin session created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
