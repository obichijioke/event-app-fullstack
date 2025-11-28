// Quick script to check for EventCreatorDraft records
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDrafts() {
  try {
    console.log('🔍 Checking for EventCreatorDraft records...\n');

    // Get all drafts
    const allDrafts = await prisma.eventCreatorDraft.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        completionPercent: true,
        activeSection: true,
        organizationId: true,
        ownerUserId: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`📊 Total drafts found: ${allDrafts.length}\n`);

    if (allDrafts.length === 0) {
      console.log('❌ No drafts found in the database.');
      console.log('\n💡 To create a draft:');
      console.log('   1. Go to /organizer/events/create');
      console.log('   2. Start filling out the event creation wizard');
      console.log('   3. Leave the page (draft will be auto-saved)\n');
    } else {
      console.log('✅ Found the following drafts:\n');

      allDrafts.forEach((draft, index) => {
        console.log(`${index + 1}. ${draft.title || 'Untitled Event'}`);
        console.log(`   ID: ${draft.id}`);
        console.log(`   Status: ${draft.status}`);
        console.log(`   Completion: ${draft.completionPercent}%`);
        console.log(`   Active Section: ${draft.activeSection || 'Not started'}`);
        console.log(`   Organization ID: ${draft.organizationId}`);
        console.log(`   Owner ID: ${draft.ownerUserId}`);
        console.log(`   Updated: ${draft.updatedAt.toISOString()}`);
        console.log('');
      });

      // Count by status
      const byStatus = allDrafts.reduce((acc, draft) => {
        acc[draft.status] = (acc[draft.status] || 0) + 1;
        return acc;
      }, {});

      console.log('📈 Breakdown by status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      console.log('');

      // Find drafts that would appear on dashboard (draft or abandoned)
      const dashboardDrafts = allDrafts.filter(
        (d) => d.status === 'draft' || d.status === 'abandoned'
      );

      console.log(`📋 Drafts visible on dashboard: ${dashboardDrafts.length}`);
      if (dashboardDrafts.length > 0) {
        console.log('   These drafts will appear in the "In Progress Events" section\n');
      }
    }

    // Check organizations
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            eventCreatorDrafts: true,
          },
        },
      },
    });

    console.log('\n🏢 Organizations with drafts:');
    orgs.forEach((org) => {
      if (org._count.eventCreatorDrafts > 0) {
        console.log(`   ${org.name}: ${org._count.eventCreatorDrafts} draft(s)`);
        console.log(`   Org ID: ${org.id}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrafts();
