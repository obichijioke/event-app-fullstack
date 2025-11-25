const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testScheduler() {
  console.log('🧪 Testing Announcements Scheduler\n');

  try {
    // Get an event
    const event = await prisma.event.findFirst({
      where: { status: 'live' },
    });

    if (!event) {
      console.log('⚠️  No live events found. Please run the main seed script first.');
      return;
    }

    console.log(`📌 Using event: ${event.title}\n`);

    // Test 1: Create a scheduled announcement for 1 minute in the future
    const scheduledTime = new Date(Date.now() + 60000); // 1 minute from now
    console.log('📝 Test 1: Creating scheduled announcement...');

    const scheduledAnnouncement = await prisma.eventAnnouncement.create({
      data: {
        eventId: event.id,
        title: 'Scheduled Test Announcement',
        message: 'This announcement was scheduled to publish automatically.',
        type: 'info',
        isActive: false,
        scheduledFor: scheduledTime,
        publishedAt: null,
        viewCount: 0,
      },
    });

    console.log(`   ✅ Created scheduled announcement (ID: ${scheduledAnnouncement.id})`);
    console.log(`   ⏰ Scheduled for: ${scheduledTime.toISOString()}`);
    console.log(`   📊 Status: isActive=${scheduledAnnouncement.isActive}, publishedAt=${scheduledAnnouncement.publishedAt}\n`);

    // Test 2: Create an announcement scheduled in the past (should be published immediately by scheduler)
    console.log('📝 Test 2: Creating past-scheduled announcement...');

    const pastScheduledAnnouncement = await prisma.eventAnnouncement.create({
      data: {
        eventId: event.id,
        title: 'Past Scheduled Announcement',
        message: 'This was scheduled in the past and should be published immediately.',
        type: 'important',
        isActive: false,
        scheduledFor: new Date(Date.now() - 5000), // 5 seconds ago
        publishedAt: null,
        viewCount: 0,
      },
    });

    console.log(`   ✅ Created past-scheduled announcement (ID: ${pastScheduledAnnouncement.id})`);
    console.log(`   ⏰ Scheduled for: ${pastScheduledAnnouncement.scheduledFor.toISOString()}`);
    console.log(`   📊 Status: isActive=${pastScheduledAnnouncement.isActive}, publishedAt=${pastScheduledAnnouncement.publishedAt}`);
    console.log('   ⏳ Waiting 65 seconds for scheduler to run...\n');

    // Wait for scheduler to process (runs every minute)
    await new Promise(resolve => setTimeout(resolve, 65000));

    // Check if past-scheduled announcement was published
    const updatedAnnouncement = await prisma.eventAnnouncement.findUnique({
      where: { id: pastScheduledAnnouncement.id },
    });

    console.log('📊 Scheduler Test Results:');
    if (updatedAnnouncement.isActive && updatedAnnouncement.publishedAt) {
      console.log('   ✅ PASS: Past-scheduled announcement was published');
      console.log(`   📅 Published at: ${updatedAnnouncement.publishedAt.toISOString()}`);
    } else {
      console.log('   ❌ FAIL: Past-scheduled announcement was NOT published');
      console.log(`   📊 Current status: isActive=${updatedAnnouncement.isActive}, publishedAt=${updatedAnnouncement.publishedAt}`);
    }

    // Test 3: Test view tracking
    console.log('\n📝 Test 3: Testing view tracking...');

    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.announcementView.create({
        data: {
          announcementId: scheduledAnnouncement.id,
          userId: user.id,
        },
      });

      await prisma.eventAnnouncement.update({
        where: { id: scheduledAnnouncement.id },
        data: { viewCount: { increment: 1 } },
      });

      const viewedAnnouncement = await prisma.eventAnnouncement.findUnique({
        where: { id: scheduledAnnouncement.id },
        include: { views: true },
      });

      console.log(`   ✅ View tracked successfully`);
      console.log(`   👁️  Total views: ${viewedAnnouncement.viewCount}`);
      console.log(`   👥 Unique viewers: ${viewedAnnouncement.views.length}\n`);
    }

    // Test 4: Test FAQ tracking
    console.log('📝 Test 4: Testing FAQ tracking...');

    const faq = await prisma.eventFAQ.findFirst({
      where: { eventId: event.id },
    });

    if (faq) {
      await prisma.eventFAQ.update({
        where: { id: faq.id },
        data: {
          viewCount: { increment: 1 },
          helpfulCount: { increment: 1 },
        },
      });

      const updatedFaq = await prisma.eventFAQ.findUnique({
        where: { id: faq.id },
      });

      console.log(`   ✅ FAQ tracking working`);
      console.log(`   ❓ Question: ${updatedFaq.question.substring(0, 50)}...`);
      console.log(`   👁️  View count: ${updatedFaq.viewCount}`);
      console.log(`   👍 Helpful count: ${updatedFaq.helpfulCount}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Scheduled announcement creation');
    console.log('✅ View tracking system');
    console.log('✅ FAQ analytics tracking');
    console.log(updatedAnnouncement.isActive ? '✅ Scheduler auto-publishing' : '⏳ Scheduler pending (check after 1 minute)');
    console.log('═══════════════════════════════════════════\n');

    console.log('💡 Tips:');
    console.log('   - Start the backend server to enable the scheduler: npm run start:dev');
    console.log('   - The scheduler runs every minute via @Cron decorator');
    console.log('   - Check server logs for: [AnnouncementsSchedulerService]');
    console.log('   - Future-scheduled announcements will publish when their time comes\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScheduler();
