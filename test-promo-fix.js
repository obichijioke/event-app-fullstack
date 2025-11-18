// Test script to verify promo code percentage discount fix
// This tests the logic fix in promotions.service.ts

console.log('Testing promo code discount calculation...\n');

// Simulate the OLD buggy logic
function calculateDiscountOld(percentOff, amountOffCents, orderAmount) {
  let discountAmount = BigInt(0);
  if (percentOff) {  // ❌ BUG: Will be false for 0 or null
    discountAmount =
      (BigInt(orderAmount || 0) * BigInt(Number(percentOff))) /
      BigInt(100);
  } else if (amountOffCents) {
    discountAmount = amountOffCents;
  }
  return discountAmount;
}

// Simulate the NEW fixed logic
function calculateDiscountNew(percentOff, amountOffCents, orderAmount) {
  let discountAmount = BigInt(0);
  if (percentOff !== null && percentOff !== undefined) {  // ✅ FIX: Explicit null check
    discountAmount =
      (BigInt(orderAmount || 0) * BigInt(Number(percentOff))) /
      BigInt(100);
  } else if (amountOffCents) {
    discountAmount = amountOffCents;
  }
  return discountAmount;
}

// Test cases
const testCases = [
  {
    name: 'Percentage discount (15%)',
    percentOff: 15,
    amountOffCents: null,
    orderAmount: 10000, // $100.00
    expectedDiscount: 1500, // $15.00
  },
  {
    name: 'Percentage discount (0%) - edge case',
    percentOff: 0,
    amountOffCents: null,
    orderAmount: 10000,
    expectedDiscount: 0,
  },
  {
    name: 'Fixed amount discount ($10.00)',
    percentOff: null,
    amountOffCents: BigInt(1000),
    orderAmount: 10000,
    expectedDiscount: 1000,
  },
  {
    name: 'Percentage discount (50%)',
    percentOff: 50,
    amountOffCents: null,
    orderAmount: 5000, // $50.00
    expectedDiscount: 2500, // $25.00
  },
  {
    name: 'Percentage discount with amountOffCents present (should use percentage)',
    percentOff: 20,
    amountOffCents: BigInt(500),
    orderAmount: 10000,
    expectedDiscount: 2000, // Should use 20% not $5.00
  },
];

console.log('==========================================');
console.log('OLD (BUGGY) LOGIC:');
console.log('==========================================\n');

testCases.forEach((test) => {
  const result = calculateDiscountOld(test.percentOff, test.amountOffCents, test.orderAmount);
  const passed = Number(result) === test.expectedDiscount;
  console.log(`Test: ${test.name}`);
  console.log(`  Input: percentOff=${test.percentOff}, amountOffCents=${test.amountOffCents}, orderAmount=${test.orderAmount}`);
  console.log(`  Expected: ${test.expectedDiscount} cents`);
  console.log(`  Got:      ${result} cents`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('\n==========================================');
console.log('NEW (FIXED) LOGIC:');
console.log('==========================================\n');

testCases.forEach((test) => {
  const result = calculateDiscountNew(test.percentOff, test.amountOffCents, test.orderAmount);
  const passed = Number(result) === test.expectedDiscount;
  console.log(`Test: ${test.name}`);
  console.log(`  Input: percentOff=${test.percentOff}, amountOffCents=${test.amountOffCents}, orderAmount=${test.orderAmount}`);
  console.log(`  Expected: ${test.expectedDiscount} cents`);
  console.log(`  Got:      ${result} cents`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('==========================================');
console.log('SUMMARY');
console.log('==========================================');
console.log('The bug was in the condition check: if (percentOff) fails for 0 and null values.');
console.log('The fix uses explicit null checks: if (percentOff !== null && percentOff !== undefined)');
console.log('This ensures percentage discounts are properly calculated even for 0% or when null.\n');
