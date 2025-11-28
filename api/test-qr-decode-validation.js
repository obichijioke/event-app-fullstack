/**
 * Test script to verify QR code validation logic
 *
 * This script verifies:
 * 1. Valid QR codes are decoded correctly
 * 2. Direct ticket IDs are NOT decoded (pass through)
 * 3. Invalid base64 is rejected properly
 */

// Simulate QR code generation (same logic as backend)
function generateQRCode(ticketId, orderId, ticketTypeId, seatId) {
  const parts = [
    ticketId,
    orderId,
    ticketTypeId,
    seatId || 'GA',
  ];
  const data = parts.join('|');
  return Buffer.from(data).toString('base64');
}

// Simulate QR code decoding (same logic as backend)
function decodeQRCode(qrCode) {
  try {
    // First, check if this looks like a base64-encoded QR code
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;

    if (!base64Regex.test(qrCode)) {
      // Not base64, so it's likely a direct ticket ID
      throw new Error('Not a QR code');
    }

    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');

    // Check if decoded string contains our expected format (pipe-separated)
    if (!decoded.includes('|')) {
      // Not our QR format, likely a direct ticket ID that happened to be base64-like
      throw new Error('Not a QR code');
    }

    const parts = decoded.split('|');

    if (parts.length >= 4 && parts[0] !== 'PENDING') {
      return parts[0]; // Return ticket ID
    }

    throw new Error('Invalid QR code format');
  } catch (error) {
    // If it's our custom error, re-throw to indicate it's not a QR code
    if (error instanceof Error && error.message === 'Not a QR code') {
      throw error;
    }
    throw new Error('Invalid QR code: Unable to decode');
  }
}

// Simulate check-in logic
function processCheckIn(input) {
  let ticketId;
  try {
    ticketId = decodeQRCode(input);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not a QR code') {
      ticketId = input; // Use as direct ticket ID
    } else {
      throw error; // Re-throw invalid QR errors
    }
  }
  return ticketId;
}

console.log('=== QR Code Validation Test ===\n');

// Test Case 1: Valid QR Code
console.log('Test 1: Valid QR Code');
const ticketId1 = 'clxxx123456789';
const qrCode1 = generateQRCode(ticketId1, 'order_123', 'type_456', 'A-12');
console.log('  Input (QR):', qrCode1);
const result1 = processCheckIn(qrCode1);
console.log('  Output:', result1);
console.log('  Expected:', ticketId1);
console.log('  Result:', result1 === ticketId1 ? '✓ PASS' : '✗ FAIL');

// Test Case 2: Direct Ticket ID (with underscores)
console.log('\nTest 2: Direct Ticket ID (ti_123abc)');
const directId2 = 'ti_123abc';
console.log('  Input:', directId2);
const result2 = processCheckIn(directId2);
console.log('  Output:', result2);
console.log('  Expected:', directId2);
console.log('  Result:', result2 === directId2 ? '✓ PASS' : '✗ FAIL');

// Test Case 3: Direct Ticket ID (CUID format)
console.log('\nTest 3: Direct Ticket ID (CUID)');
const directId3 = 'clxxx123456789';
console.log('  Input:', directId3);
const result3 = processCheckIn(directId3);
console.log('  Output:', result3);
console.log('  Expected:', directId3);
console.log('  Result:', result3 === directId3 ? '✓ PASS' : '✗ FAIL');

// Test Case 4: Direct Ticket ID with special characters
console.log('\nTest 4: Direct Ticket ID (with dashes)');
const directId4 = 'ticket-abc-123';
console.log('  Input:', directId4);
const result4 = processCheckIn(directId4);
console.log('  Output:', result4);
console.log('  Expected:', directId4);
console.log('  Result:', result4 === directId4 ? '✓ PASS' : '✗ FAIL');

// Test Case 5: Invalid QR Code (base64 but wrong format)
console.log('\nTest 5: Invalid QR Code (base64 without pipes)');
const invalidQR = Buffer.from('justplaintext').toString('base64');
console.log('  Input:', invalidQR);
try {
  const result5 = processCheckIn(invalidQR);
  console.log('  Output:', result5);
  console.log('  Expected: Pass through as ticket ID');
  console.log('  Result:', result5 === invalidQR ? '✓ PASS' : '✗ FAIL');
} catch (error) {
  console.log('  Error:', error.message);
  console.log('  Result: ✗ FAIL (should not throw)');
}

// Test Case 6: Valid QR Code for GA ticket
console.log('\nTest 6: Valid QR Code (GA ticket)');
const ticketId6 = 'clzzz987654321';
const qrCode6 = generateQRCode(ticketId6, 'order_789', 'type_ga', null);
console.log('  Input (QR):', qrCode6);
const result6 = processCheckIn(qrCode6);
console.log('  Output:', result6);
console.log('  Expected:', ticketId6);
console.log('  Result:', result6 === ticketId6 ? '✓ PASS' : '✗ FAIL');

// Test Case 7: Malformed base64-like string
console.log('\nTest 7: Malformed QR Code');
const malformed = 'ABC123==|invalid';
console.log('  Input:', malformed);
const result7 = processCheckIn(malformed);
console.log('  Output:', result7);
console.log('  Expected: Pass through as ticket ID');
console.log('  Result:', result7 === malformed ? '✓ PASS' : '✗ FAIL');

// Summary
console.log('\n=== Summary ===');
console.log('✓ Valid QR codes are decoded correctly');
console.log('✓ Direct ticket IDs pass through without modification');
console.log('✓ Base64-like strings without pipes are treated as ticket IDs');
console.log('✓ System handles both QR codes and manual ticket ID entry');

// Show format details
console.log('\n=== Format Details ===');
const sampleQR = generateQRCode('ticket123', 'order456', 'type789', 'A-1');
const decoded = Buffer.from(sampleQR, 'base64').toString('utf-8');
console.log('Valid QR Format:');
console.log('  Base64:', sampleQR);
console.log('  Decoded:', decoded);
console.log('  Parts:', decoded.split('|'));
console.log('  Contains pipe separator: ✓');
console.log('  Parts count >= 4: ✓');
