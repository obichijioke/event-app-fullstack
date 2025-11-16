import { Prisma } from '@prisma/client';

/**
 * Serializes data by converting BigInt and Prisma.Decimal types to numbers
 * This is necessary because JSON.stringify cannot handle BigInt values directly
 * and we want consistent number formatting for Prisma Decimal types
 *
 * @param data The data to serialize (can be any type)
 * @returns The serialized data with BigInt and Decimal converted to numbers
 *
 * @example
 * const event = await prisma.event.findUnique({ where: { id } });
 * return serializeResponse(event);
 */
export function serializeResponse<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === 'bigint') {
        return Number(value);
      }
      if (value instanceof Prisma.Decimal) {
        return value.toNumber();
      }
      return value;
    }),
  );
}
