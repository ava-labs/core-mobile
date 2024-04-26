export const bigIntToHex = (n: bigint | undefined): string =>
  `0x${BigInt(n ?? 0).toString(16)}`
