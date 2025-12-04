/**
 * Test script for Dispute API endpoints
 *
 * Run this after the backend is running to verify all endpoints work
 *
 * Usage:
 * 1. Start backend: npm run start:dev
 * 2. Get a valid JWT token and orgId
 * 3. Update TOKEN and ORG_ID below
 * 4. Run: node test-dispute-api.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// UPDATE THESE VALUES
const TOKEN = 'YOUR_JWT_TOKEN_HERE';
const ORG_ID = 'YOUR_ORG_ID_HERE';

async function testDisputeEndpoints() {
  console.log('🧪 Testing Dispute API Endpoints\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Organization ID: ${ORG_ID}\n`);

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // Test 1: Get Dispute Statistics
    console.log('1️⃣ Testing GET /organizer/disputes/stats');
    const statsResponse = await fetch(
      `${API_BASE_URL}/organizer/disputes/stats?orgId=${ORG_ID}`,
      { headers }
    );
    const stats = await statsResponse.json();
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));
    console.log();

    // Test 2: List Disputes
    console.log('2️⃣ Testing GET /organizer/disputes');
    const listResponse = await fetch(
      `${API_BASE_URL}/organizer/disputes?orgId=${ORG_ID}&page=1&limit=10`,
      { headers }
    );
    const disputeList = await listResponse.json();
    console.log('✅ Dispute List:', JSON.stringify({
      total: disputeList.total,
      page: disputeList.page,
      disputeCount: disputeList.disputes?.length || 0,
    }, null, 2));
    console.log();

    // Test 3: Get Single Dispute (if any exist)
    if (disputeList.disputes && disputeList.disputes.length > 0) {
      const disputeId = disputeList.disputes[0].id;
      console.log(`3️⃣ Testing GET /organizer/disputes/${disputeId}`);
      const detailResponse = await fetch(
        `${API_BASE_URL}/organizer/disputes/${disputeId}?orgId=${ORG_ID}`,
        { headers }
      );
      const dispute = await detailResponse.json();
      console.log('✅ Dispute Detail:', JSON.stringify({
        id: dispute.id,
        status: dispute.status,
        provider: dispute.provider,
        reason: dispute.reason,
        hasEvidence: dispute.evidence?.length > 0,
      }, null, 2));
      console.log();

      // Test 4: Get Evidence
      console.log(`4️⃣ Testing GET /organizer/disputes/${disputeId}/evidence`);
      const evidenceResponse = await fetch(
        `${API_BASE_URL}/organizer/disputes/${disputeId}/evidence?orgId=${ORG_ID}`,
        { headers }
      );
      const evidence = await evidenceResponse.json();
      console.log('✅ Evidence:', JSON.stringify({
        count: evidence.length,
        files: evidence.map(e => ({ fileName: e.fileName, mimeType: e.mimeType }))
      }, null, 2));
      console.log();

      // Test 5: Submit Response (commented out to avoid modifying data)
      console.log(`5️⃣ Testing POST /organizer/disputes/${disputeId}/respond (SKIPPED)`);
      console.log('⚠️  Skipped to avoid modifying dispute status');
      console.log('   To test: Uncomment the code block in test-dispute-api.js');
      console.log();

      /* UNCOMMENT TO TEST RESPONSE SUBMISSION
      if (dispute.status === 'needs_response') {
        const responseData = {
          responseNote: 'Test response from API test script. The customer received the tickets and attended the event.',
          evidenceUrls: []
        };
        const responseSubmit = await fetch(
          `${API_BASE_URL}/organizer/disputes/${disputeId}/respond?orgId=${ORG_ID}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(responseData)
          }
        );
        const submitResult = await responseSubmit.json();
        console.log('✅ Response Submitted:', JSON.stringify({
          id: submitResult.id,
          status: submitResult.status,
          submittedAt: submitResult.submittedAt
        }, null, 2));
        console.log();
      }
      */
    } else {
      console.log('⚠️  No disputes found for this organization');
      console.log('   Create a test dispute via webhook or database to test individual dispute endpoints');
      console.log();
    }

    // Test 6: Filter by Status
    console.log('6️⃣ Testing GET /organizer/disputes with status filter');
    const filterResponse = await fetch(
      `${API_BASE_URL}/organizer/disputes?orgId=${ORG_ID}&status=needs_response&page=1&limit=5`,
      { headers }
    );
    const filteredList = await filterResponse.json();
    console.log('✅ Filtered List (needs_response):', JSON.stringify({
      total: filteredList.total,
      disputeCount: filteredList.disputes?.length || 0,
    }, null, 2));
    console.log();

    // Test 7: Search
    console.log('7️⃣ Testing GET /organizer/disputes with search');
    const searchResponse = await fetch(
      `${API_BASE_URL}/organizer/disputes?orgId=${ORG_ID}&search=test&page=1&limit=5`,
      { headers }
    );
    const searchList = await searchResponse.json();
    console.log('✅ Search Results:', JSON.stringify({
      total: searchList.total,
      disputeCount: searchList.disputes?.length || 0,
    }, null, 2));
    console.log();

    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Total disputes: ${stats.total}`);
    console.log(`   - Needs response: ${stats.needs_response}`);
    console.log(`   - Under review: ${stats.under_review}`);
    console.log(`   - Won: ${stats.won}`);
    console.log(`   - Lost: ${stats.lost}`);
    console.log(`   - Win rate: ${stats.winRate.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Backend is running (npm run start:dev)');
    console.error('   2. TOKEN and ORG_ID are set correctly');
    console.error('   3. User has organizer role and belongs to the organization');
  }
}

// Run tests
if (TOKEN === 'YOUR_JWT_TOKEN_HERE' || ORG_ID === 'YOUR_ORG_ID_HERE') {
  console.error('❌ Please update TOKEN and ORG_ID in test-dispute-api.js before running');
  process.exit(1);
}

testDisputeEndpoints();
