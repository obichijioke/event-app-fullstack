const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('📊 Checking seed data...\n');

    // Check announcements
    const announcements = await prisma.eventAnnouncement.findMany({
      include: {
        event: {
          select: { title: true }
        }
      }
    });

    console.log(`📢 Announcements (${announcements.length}):`);
    announcements.forEach(a => {
      console.log(`  - ${a.title} (${a.type})`);
      console.log(`    Event: ${a.event.title}`);
      console.log(`    Published: ${a.publishedAt ? 'Yes' : 'No (scheduled)'}`);
      console.log(`    View count: ${a.viewCount}`);
      console.log('');
    });

    // Check FAQs
    const faqs = await prisma.eventFAQ.findMany({
      include: {
        event: {
          select: { title: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`❓ FAQs (${faqs.length}):`);
    faqs.forEach(f => {
      console.log(`  ${f.sortOrder}. ${f.question}`);
      console.log(`     Event: ${f.event.title}`);
      console.log(`     Views: ${f.viewCount}, Helpful: ${f.helpfulCount}, Source: ${f.source}`);
      console.log('');
    });

    console.log('✅ Seed data verification complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
