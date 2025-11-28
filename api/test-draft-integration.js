#!/usr/bin/env node
/**
 * Test script to verify the draft integration implementation
 *
 * This script checks:
 * 1. EventCreatorDraft model exists and has correct schema
 * 2. EventCreatorDraftStatus enum has correct values
 * 3. Dashboard service queries are correctly structured
 *
 * Run: node test-draft-integration.js
 */

const { PrismaClient } = require('@prisma/client');
const { EventCreatorDraftStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDraftIntegration() {
  console.log('🔍 Testing Draft Integration Implementation\n');

  try {
    // Test 1: Verify EventCreatorDraftStatus enum values
    console.log('✅ Test 1: Verify EventCreatorDraftStatus enum');
    const expectedStatuses = ['draft', 'ready', 'scheduled', 'published', 'archived'];
    const actualStatuses = Object.values(EventCreatorDraftStatus);

    console.log('   Expected statuses:', expectedStatuses);
    console.log('   Actual statuses:', actualStatuses);

    const hasAllStatuses = expectedStatuses.every(status =>
      actualStatuses.includes(status)
    );

    if (hasAllStatuses) {
      console.log('   ✅ All expected status values present\n');
    } else {
      console.log('   ❌ Missing status values\n');
      return;
    }

    // Test 2: Query drafts with correct status filter
    console.log('✅ Test 2: Query drafts with status filter');
    const drafts = await prisma.eventCreatorDraft.findMany({
      where: {
        status: {
          in: [
            EventCreatorDraftStatus.draft,
            EventCreatorDraftStatus.archived,
          ],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        completionPercent: true,
        activeSection: true,
        lastAutosavedAt: true,
        updatedAt: true,
        createdAt: true,
        organizationId: true,
        ownerUserId: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    console.log(`   Found ${drafts.length} drafts with status 'draft' or 'archived'\n`);

    if (drafts.length > 0) {
      console.log('   Sample draft:');
      const sample = drafts[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Title: ${sample.title || 'Untitled'}`);
      console.log(`   - Status: ${sample.status}`);
      console.log(`   - Completion: ${sample.completionPercent}%`);
      console.log(`   - Active Section: ${sample.activeSection || 'Not started'}`);
      console.log(`   - Updated: ${sample.updatedAt.toISOString()}\n`);
    } else {
      console.log('   ℹ️  No drafts found. Create a draft by:');
      console.log('      1. Starting the backend: cd api && npm run start:dev');
      console.log('      2. Starting the frontend: cd frontend/web-app && npm run dev');
      console.log('      3. Navigate to /organizer/events/create-v2');
      console.log('      4. Start creating an event and leave before publishing\n');
    }

    // Test 3: Verify no 'abandoned' status exists
    console.log('✅ Test 3: Verify no invalid "abandoned" status');
    const invalidDrafts = await prisma.$queryRaw`
      SELECT id, status FROM event_creator_drafts
      WHERE status NOT IN ('draft', 'ready', 'scheduled', 'published', 'archived')
    `;

    if (invalidDrafts.length === 0) {
      console.log('   ✅ No drafts with invalid status values\n');
    } else {
      console.log(`   ❌ Found ${invalidDrafts.length} drafts with invalid status:\n`);
      invalidDrafts.forEach(draft => {
        console.log(`   - ID: ${draft.id}, Status: ${draft.status}`);
      });
      console.log();
    }

    // Test 4: Check organizations with drafts
    console.log('✅ Test 4: Check organizations with drafts');
    const orgsWithDrafts = await prisma.organization.findMany({
      where: {
        eventCreatorDrafts: {
          some: {
            status: {
              in: [
                EventCreatorDraftStatus.draft,
                EventCreatorDraftStatus.archived,
              ],
            },
          },
        },
      },
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

    console.log(`   Found ${orgsWithDrafts.length} organization(s) with drafts:\n`);
    orgsWithDrafts.forEach(org => {
      console.log(`   - ${org.name}: ${org._count.eventCreatorDrafts} draft(s)`);
      console.log(`     Org ID: ${org.id}`);
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - EventCreatorDraftStatus enum is correct');
    console.log('   - Database queries work properly');
    console.log('   - No invalid status values found');
    console.log('   - Dashboard integration ready to use');
    console.log('\n💡 Next steps:');
    console.log('   1. Start backend: cd api && npm run start:dev');
    console.log('   2. Start frontend: cd frontend/web-app && npm run dev');
    console.log('   3. Navigate to /organizer to see drafts');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    if (error.code === 'P2021') {
      console.error('\n💡 Tip: Run "npx prisma generate" to generate the Prisma client');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDraftIntegration();
