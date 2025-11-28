const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupRevokedSessions() {
  console.log('Cleaning up all revoked sessions (keeping active ones)...');

  const result = await prisma.userSession.deleteMany({
    where: {
      revokedAt: {
        not: null
      }
    }
  });

  console.log(`Deleted ${result.count} revoked sessions`);

  // Show remaining stats
  const totalCount = await prisma.userSession.count();
  const activeCount = await prisma.userSession.count({ where: { revokedAt: null } });

  console.log('\n--- Updated Summary ---');
  console.log(`Total sessions remaining: ${totalCount}`);
  console.log(`Active sessions: ${activeCount}`);

  // Show sessions by user
  const sessions = await prisma.userSession.findMany({
    where: { revokedAt: null },
    include: {
      user: {
        select: { email: true }
      }
    }
  });

  const userGroups = {};
  sessions.forEach(s => {
    if (!userGroups[s.userId]) {
      userGroups[s.userId] = {
        email: s.user.email,
        count: 0
      };
    }
    userGroups[s.userId].count++;
  });

  console.log('\n--- Active Sessions by User ---');
  Object.entries(userGroups).forEach(([userId, stats]) => {
    console.log(`${stats.email}: ${stats.count} active session(s)`);
  });

  await prisma.$disconnect();
}

cleanupRevokedSessions().catch(console.error);
