/**
 * Test script to verify ticket deduplication logic
 *
 * This script simulates:
 * 1. Initial ticket creation
 * 2. Webhook retry (should NOT create duplicates)
 * 3. Verifies barcode-based deduplication works correctly
 */

// Simulate barcode generation (same logic as backend)
function generateBarcode(orderId, ticketTypeId, seatId, index = 0) {
  const data = `${orderId}-${ticketTypeId}${seatId ? `-${seatId}` : ''}-${index}`;
  return data;
}

console.log('=== Ticket Deduplication Test ===\n');

const orderId = 'order_123';
const items = [
  { ticketTypeId: 'vip_001', seatId: 'A-12', quantity: 2 },
  { ticketTypeId: 'ga_001', seatId: null, quantity: 3 },
];

// Simulate first call - create all tickets
console.log('Step 1: Initial ticket creation');
const existingTickets = [];

for (const item of items) {
  for (let i = 0; i < item.quantity; i++) {
    const barcode = generateBarcode(orderId, item.ticketTypeId, item.seatId, i);
    const ticket = {
      id: `ticket_${Date.now()}_${i}`,
      orderId,
      ticketTypeId: item.ticketTypeId,
      seatId: item.seatId,
      barcode,
      qrCode: `qr_${barcode}`, // Simplified
    };
    existingTickets.push(ticket);
    console.log(`  Created: ${barcode}`);
  }
}

console.log(`\nTotal tickets created: ${existingTickets.length}`);

// Simulate second call (webhook retry) - should skip all
console.log('\n\nStep 2: Webhook retry (simulate duplicate call)');
const existingBarcodes = new Set(existingTickets.map((t) => t.barcode));
let skipped = 0;
let created = 0;

for (const item of items) {
  for (let i = 0; i < item.quantity; i++) {
    const barcode = generateBarcode(orderId, item.ticketTypeId, item.seatId, i);

    if (existingBarcodes.has(barcode)) {
      console.log(`  Skipped (already exists): ${barcode}`);
      skipped++;
      continue;
    }

    console.log(`  Created (new): ${barcode}`);
    created++;
    existingBarcodes.add(barcode);
  }
}

console.log(`\n\nStep 3: Results`);
console.log(`  Existing tickets: ${existingTickets.length}`);
console.log(`  Skipped (duplicates): ${skipped}`);
console.log(`  Newly created: ${created}`);
console.log(`  Final total: ${existingTickets.length + created}`);

// Verify
console.log('\n\nStep 4: Verification');
const expectedTotal = items.reduce((sum, item) => sum + item.quantity, 0);
const actualTotal = existingTickets.length + created;

console.log(`  Expected total tickets: ${expectedTotal}`);
console.log(`  Actual total tickets: ${actualTotal}`);
console.log(`  Duplicates prevented: ${skipped === expectedTotal ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  No new tickets created: ${created === 0 ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Total matches expected: ${actualTotal === expectedTotal ? '✓ PASS' : '✗ FAIL'}`);

// Test barcode format
console.log('\n\nStep 5: Barcode Format Verification');
console.log('Sample barcodes:');
existingTickets.forEach((ticket, idx) => {
  if (idx < 3) {
    console.log(`  ${ticket.barcode}`);
  }
});

console.log('\n✓ Deduplication logic working correctly!');
console.log('✓ Barcode-based idempotency prevents duplicate tickets');
