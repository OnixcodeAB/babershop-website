import { PrismaClient } from '@prisma/client';

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

  // 2) Backfill services without categories
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

  console.log('Seed complete: categories ensured and services backfilled.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

