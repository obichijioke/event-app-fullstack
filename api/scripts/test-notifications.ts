/**
 * Test script to send various types of notifications
 *
 * Usage:
 * 1. Get a JWT token by logging in
 * 2. Run: npx ts-node scripts/test-notifications.ts <token> <userId>
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const testNotifications = [
  {
    type: 'success',
    category: 'order',
    title: 'New Order Received',
    message: 'You have received a new order for $125.50',
    actionUrl: '/organizer/orders/123',
    actionText: 'View Order',
  },
  {
    type: 'info',
    category: 'event',
    title: 'Event Published',
    message: 'Your event "Summer Music Festival" has been published and is now live.',
    actionUrl: '/organizer/events/456',
    actionText: 'View Event',
  },
  {
    type: 'success',
    category: 'payout',
    title: 'Payout Processed',
    message: 'Your payout of $1,250.00 has been processed and will arrive in 2-3 business days.',
    actionUrl: '/organizer/payouts/789',
    actionText: 'View Payout',
  },
  {
    type: 'warning',
    category: 'moderation',
    title: 'Content Flagged for Review',
    message: 'Your event "Beach Party 2025" has been flagged for review by our moderation team.',
    actionUrl: '/organizer/moderation/flags/111',
    actionText: 'Review Flag',
  },
  {
    type: 'info',
    category: 'ticket',
    title: 'Tickets Sold',
    message: '5 tickets have been sold for your event "Tech Conference 2025"',
  },
  {
    type: 'error',
    category: 'system',
    title: 'Payment Failed',
    message: 'A payment attempt for order #12345 has failed. Please review the order.',
    actionUrl: '/organizer/orders/12345',
    actionText: 'View Order',
  },
  {
    type: 'info',
    category: 'marketing',
    title: 'Marketing Tip',
    message: 'Did you know? Events with cover images get 3x more views!',
  },
];

async function sendTestNotifications(token: string, userId: string) {
  console.log('Sending test notifications...\n');

  for (let i = 0; i < testNotifications.length; i++) {
    const notif = testNotifications[i];

    try {
      const response = await axios.post(
        `${API_URL}/notifications/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`✓ Sent notification ${i + 1}/${testNotifications.length}: ${notif.title}`);

      // Wait 500ms between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`✗ Failed to send notification ${i + 1}: ${error.message}`);
    }
  }

  console.log('\n✓ All test notifications sent!');
}

// Main execution
const token = process.argv[2];
const userId = process.argv[3];

if (!token || !userId) {
  console.error('Usage: npx ts-node scripts/test-notifications.ts <token> <userId>');
  process.exit(1);
}

sendTestNotifications(token, userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
