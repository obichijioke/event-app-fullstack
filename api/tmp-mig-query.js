const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe("SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at");
  console.log(rows);
  await prisma.$disconnect();
})();
