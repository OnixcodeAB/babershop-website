import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

function createSlotId(dayIndex: number, sequence: number) {
  return `slot-${dayIndex}-${sequence}`;
}

function buildSlot(start: Date, minutes: number) {
  return new Date(start.getTime() + minutes * 60_000);
}

async function main() {
  const serviceData = [
    {
      id: 'svc-classic-cut',
      name: 'Classic Cut',
      description: 'Timeless clipper and scissor work with hot towel finish.',
      durationMinutes: 45,
      priceCents: 3000,
    },
    {
      id: 'svc-beard-trim',
      name: 'Beard Trim',
      description: 'Precision beard sculpting with hot towel and oils.',
      durationMinutes: 30,
      priceCents: 2000,
    },
  ];

  await prisma.$transaction(
    serviceData.map((service) =>
      prisma.service.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          isActive: true,
        },
        create: service,
      }),
    ),
  );

  const barber = await prisma.barber.upsert({
    where: { id: 'barber-alex' },
    update: {
      services: {
        set: serviceData.map((service) => ({ id: service.id })),
      },
    },
    create: {
      id: 'barber-alex',
      name: 'Alex Fade',
      bio: '10+ years crafting sharp fades and beard work.',
      services: {
        connect: serviceData.map((service) => ({ id: service.id })),
      },
    },
  });

  const today = new Date();
  today.setMinutes(0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const slots: { id: string; start: Date; end: Date; barberId: string }[] = [];
  const dailyStartHours = [9, 10, 11, 13];

  for (let dayIndex = 0; dayIndex < 3; dayIndex += 1) {
    for (let sequence = 0; sequence < dailyStartHours.length; sequence += 1) {
      const start = new Date(today);
      start.setDate(today.getDate() + dayIndex + 1);
      start.setHours(dailyStartHours[sequence], 0, 0, 0);
      const end = buildSlot(start, 45);

      slots.push({
        id: createSlotId(dayIndex, sequence),
        start,
        end,
        barberId: barber.id,
      });
    }
  }

  await prisma.$transaction(
    slots.map((slot) =>
      prisma.timeSlot.upsert({
        where: { id: slot.id },
        update: {
          start: slot.start,
          end: slot.end,
          isBlocked: false,
          barberId: slot.barberId,
        },
        create: slot,
      }),
    ),
  );

  await prisma.user.upsert({
    where: { email: 'admin@barbershop.dev' },
    update: {
      role: 'ADMIN',
      passwordHash: hashPassword('change-me'),
    },
    create: {
      email: 'admin@barbershop.dev',
      role: 'ADMIN',
      passwordHash: hashPassword('change-me'),
    },
  });

  console.log(`Seed completed with ${serviceData.length} services, 1 barber, ${slots.length} time slots, and admin account admin@barbershop.dev.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
