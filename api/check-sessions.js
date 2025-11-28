const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
  const sessions = await prisma.userSession.findMany({
    include: {
      user: {
        select: { email: true, id: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log('Total sessions (last 30):', sessions.length);
  console.log('\n--- Session Details ---\n');
  sessions.forEach((s, i) => {
    console.log(`${i+1}. User: ${s.user.email} (${s.user.id.substring(0, 8)})`);
    console.log(`   Session ID: ${s.id.substring(0, 12)}`);
    console.log(`   Created: ${s.createdAt.toISOString()}`);
    console.log(`   Revoked: ${s.revokedAt ? s.revokedAt.toISOString() : 'Active'}`);
    console.log(`   User Agent: ${s.userAgent || 'N/A'}`);
    console.log(`   IP: ${s.ipAddr || 'N/A'}`);
    console.log('');
  });

  const totalCount = await prisma.userSession.count();
  const activeCount = await prisma.userSession.count({ where: { revokedAt: null } });
  const revokedCount = await prisma.userSession.count({ where: { revokedAt: { not: null } } });

  // Group by user
  const userGroups = {};
  sessions.forEach(s => {
    if (!userGroups[s.userId]) {
      userGroups[s.userId] = {
        email: s.user.email,
        active: 0,
        revoked: 0,
        total: 0
      };
    }
    userGroups[s.userId].total++;
    if (s.revokedAt) {
      userGroups[s.userId].revoked++;
    } else {
      userGroups[s.userId].active++;
    }
  });

  console.log('\n--- Summary ---');
  console.log(`Total sessions: ${totalCount}`);
  console.log(`Active sessions: ${activeCount}`);
  console.log(`Revoked sessions: ${revokedCount}`);

  console.log('\n--- Sessions by User ---');
  Object.entries(userGroups).forEach(([userId, stats]) => {
    console.log(`${stats.email}: ${stats.total} total (${stats.active} active, ${stats.revoked} revoked)`);
  });

  await prisma.$disconnect();
}

checkSessions().catch(console.error);
