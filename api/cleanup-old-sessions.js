const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldSessions() {
  // Delete revoked sessions older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log('Cleaning up old sessions...');
  console.log(`Deleting revoked sessions older than ${thirtyDaysAgo.toISOString()}`);

  const result = await prisma.userSession.deleteMany({
    where: {
      revokedAt: {
        not: null,
        lt: thirtyDaysAgo
      }
    }
  });

  console.log(`Deleted ${result.count} old revoked sessions`);

  // Show remaining stats
  const totalCount = await prisma.userSession.count();
  const activeCount = await prisma.userSession.count({ where: { revokedAt: null } });
  const revokedCount = await prisma.userSession.count({ where: { revokedAt: { not: null } } });

  console.log('\n--- Updated Summary ---');
  console.log(`Total sessions: ${totalCount}`);
  console.log(`Active sessions: ${activeCount}`);
  console.log(`Revoked sessions (kept for audit): ${revokedCount}`);

  await prisma.$disconnect();
}

cleanupOldSessions().catch(console.error);
