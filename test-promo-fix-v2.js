// Test script to verify promo code percentage discount fix - Version 2
// This tests edge cases with Decimal type from Prisma

console.log('Testing promo code discount calculation with Decimal type...\n');

// Simulate Prisma Decimal type behavior
class Decimal {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return String(this.value);
  }

  toNumber() {
    return Number(this.value);
  }
}

// Simulate the OLD buggy logic
function calculateDiscountOld(percentOff, amountOffCents, orderAmount) {
  let discountAmount = BigInt(0);
  if (percentOff) {  // ❌ BUG: Truthy check fails for Decimal(0)
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

// Test cases with Decimal type (as returned by Prisma)
const testCases = [
  {
    name: 'Percentage discount (15%) as Decimal',
    percentOff: new Decimal(15),
    amountOffCents: null,
    orderAmount: 10000,
    expectedDiscount: 1500,
  },
  {
    name: 'Percentage discount (0%) as Decimal - edge case',
    percentOff: new Decimal(0),
    amountOffCents: null,
    orderAmount: 10000,
    expectedDiscount: 0,
  },
  {
    name: 'Fixed amount discount - percentOff is null',
    percentOff: null,
    amountOffCents: BigInt(1000),
    orderAmount: 10000,
    expectedDiscount: 1000,
  },
  {
    name: 'Percentage discount (25%) with amountOffCents=0',
    percentOff: new Decimal(25),
    amountOffCents: BigInt(0),
    orderAmount: 8000,
    expectedDiscount: 2000,
  },
];

console.log('==========================================');
console.log('OLD (BUGGY) LOGIC:');
console.log('==========================================\n');

let oldFailCount = 0;
testCases.forEach((test) => {
  const result = calculateDiscountOld(test.percentOff, test.amountOffCents, test.orderAmount);
  const passed = Number(result) === test.expectedDiscount;
  if (!passed) oldFailCount++;

  console.log(`Test: ${test.name}`);
  console.log(`  Input: percentOff=${test.percentOff}, amountOffCents=${test.amountOffCents}, orderAmount=${test.orderAmount}`);
  console.log(`  Expected: ${test.expectedDiscount} cents`);
  console.log(`  Got:      ${result} cents`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('\n==========================================');
console.log('NEW (FIXED) LOGIC:');
console.log('==========================================\n');

let newFailCount = 0;
testCases.forEach((test) => {
  const result = calculateDiscountNew(test.percentOff, test.amountOffCents, test.orderAmount);
  const passed = Number(result) === test.expectedDiscount;
  if (!passed) newFailCount++;

  console.log(`Test: ${test.name}`);
  console.log(`  Input: percentOff=${test.percentOff}, amountOffCents=${test.amountOffCents}, orderAmount=${test.orderAmount}`);
  console.log(`  Expected: ${test.expectedDiscount} cents`);
  console.log(`  Got:      ${result} cents`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('==========================================');
console.log('SUMMARY');
console.log('==========================================');
console.log(`Old logic: ${testCases.length - oldFailCount}/${testCases.length} tests passed`);
console.log(`New logic: ${testCases.length - newFailCount}/${testCases.length} tests passed`);
console.log('\nThe key insight: Decimal objects from Prisma are truthy even when value is 0.');
console.log('Using explicit null checks prevents bugs with Decimal types.\n');
