/**
 * Test script to verify duplicate event publishing is prevented
 *
 * This simulates a user clicking "Publish" twice rapidly
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const DRAFT_ID = 'test-draft-id'; // Replace with actual draft ID
const TOKEN = 'your-jwt-token'; // Replace with actual token

async function testDuplicatePublish() {
  console.log('Testing duplicate publish prevention...\n');

  try {
    // Simulate two rapid publish requests (like double-clicking)
    const [response1, response2] = await Promise.all([
      axios.post(
        `${API_URL}/creator-v2/drafts/${DRAFT_ID}/publish`,
        {},
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      ).catch(err => err.response),

      axios.post(
        `${API_URL}/creator-v2/drafts/${DRAFT_ID}/publish`,
        {},
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      ).catch(err => err.response)
    ]);

    console.log('Response 1:', {
      status: response1.status,
      message: response1.data?.message,
      eventId: response1.data?.eventId
    });

    console.log('\nResponse 2:', {
      status: response2.status,
      message: response2.data?.message,
      eventId: response2.data?.eventId
    });

    // Verify both requests returned the same event
    if (response1.data?.eventId === response2.data?.eventId) {
      console.log('\n✓ SUCCESS: Both requests returned the same event ID');
      console.log('✓ No duplicate events were created');
    } else {
      console.log('\n✗ FAILURE: Different event IDs returned');
      console.log('✗ Duplicate events may have been created');
    }

  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

testDuplicatePublish();
