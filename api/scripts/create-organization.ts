import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrganization(userId: string, orgName: string) {
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

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        ownerId: userId,
        name: orgName,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: true,
      },
    });

    console.log('\nðŸŽ‰ Organization created successfully!');
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    console.log('Organization ID:', organization.id);
    console.log('Name:', organization.name);
    console.log('Owner:', user.email);
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');
    console.log('ðŸ”— Use this URL to start the creator:');
    console.log(`${process.env.FRONTEND_URL || "http://localhost:3001"}/organizer/events/create?org=\n`);

    return organization;
  } catch (error) {
    console.error('âŒ Error creating organization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: ts-node scripts/create-organization.ts <userId> <orgName>
const userId = process.argv[2];
const orgName = process.argv[3] || 'My Event Company';

if (!userId) {
  console.error('âŒ Please provide a userId');
  console.log('Usage: npx ts-node scripts/create-organization.ts <userId> [orgName]');
  process.exit(1);
}

createOrganization(userId, orgName);

