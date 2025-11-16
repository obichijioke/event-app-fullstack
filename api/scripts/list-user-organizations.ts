import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUserOrganizations(userId: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.error('âŒ User not found with ID:', userId);
      return;
    }

    console.log('âœ… Found user:', user.email);
    console.log('\nðŸ¢ Organizations for this user:');
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

    // Get all organizations where user is a member
    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (organizations.length === 0) {
      console.log('ðŸ“­ No organizations found for this user.');
      console.log('\nðŸ’¡ Create one with:');
      console.log(`npx ts-node scripts/create-organization.ts ${userId} "My Event Company"\n`);
      return;
    }

    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Role: ${org.members[0]?.role || 'N/A'}`);
      console.log(`   Events: ${org._count.events}`);
      console.log(`   Members: ${org._count.members}`);
      console.log(`   ðŸ”— Creator URL: ${process.env.FRONTEND_URL || "http://localhost:3001"}/organizer/events/create?org=${org.id}`);
      console.log('');
    });

    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');
  } catch (error) {
    console.error('âŒ Error listing organizations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: ts-node scripts/list-user-organizations.ts <userId>
const userId = process.argv[2];

if (!userId) {
  console.error('âŒ Please provide a userId');
  console.log('Usage: npx ts-node scripts/list-user-organizations.ts <userId>');
  process.exit(1);
}

listUserOrganizations(userId);


