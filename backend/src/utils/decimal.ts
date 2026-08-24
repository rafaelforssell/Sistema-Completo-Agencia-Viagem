import type { Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return Number(value);
}
