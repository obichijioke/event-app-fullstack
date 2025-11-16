import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser(emailOrId: string) {
  try {
    // Try to find by email first, then by ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrId, mode: 'insensitive' } },
          { id: emailOrId },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error('âŒ User not found with email or ID:', emailOrId);
      return;
    }

    console.log('\nâœ… User found!');
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name || 'N/A');
    console.log('Platform Role:', user.role);
    console.log('Created:', user.createdAt.toLocaleDateString());
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

    // Get organizations
    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: user.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (organizations.length > 0) {
      console.log('ðŸ¢ Organizations:');
      organizations.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name}`);
        console.log(`   ID: ${org.id}`);
        console.log(`   Role: ${org.members[0]?.role || 'N/A'}`);
        console.log(`   ðŸ”— Creator: ${process.env.FRONTEND_URL || "http://localhost:3001"}/organizer/events/create?org=${org.id}`);
        console.log('');
      });
    } else {
      console.log('ðŸ“­ No organizations found for this user.\n');
      console.log('ðŸ’¡ Create one with:');
      console.log(`npx ts-node scripts/create-organization.ts ${user.id} "My Event Company"\n`);
    }

    console.log('\nðŸ“‹ Quick commands:');
    console.log(`npx ts-node scripts/list-user-organizations.ts ${user.id}`);
    console.log(`npx ts-node scripts/create-organization.ts ${user.id} "Organization Name"\n`);
  } catch (error) {
    console.error('âŒ Error finding user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: ts-node scripts/find-user.ts <email_or_id>
const emailOrId = process.argv[2];

if (!emailOrId) {
  console.error('âŒ Please provide a user email or ID');
  console.log('Usage: npx ts-node scripts/find-user.ts <email_or_id>');
  console.log('Example: npx ts-node scripts/find-user.ts user@example.com');
  process.exit(1);
}

findUser(emailOrId);

