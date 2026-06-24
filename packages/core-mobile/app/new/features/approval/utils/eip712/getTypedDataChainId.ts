/**
 * Extracts the chainId declared inside an EIP-712 typed-data domain.
 *
 * Per EIP-712 the domain `chainId` is a uint256, but dApps serialize it
 * inconsistently — as a JS number, a decimal string, or a hex string. We
 * normalize all of these to a number. Returns undefined when there is no
 * domain chainId (e.g. V1 typed data, or a domain that omits it).
 */
export const getTypedDataChainId = (data: unknown): number | undefined => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined

  const domain = (data as Record<string, unknown>).domain
  if (typeof domain !== 'object' || domain === null) return undefined

  const chainId = (domain as Record<string, unknown>).chainId
  if (chainId === undefined || chainId === null) return undefined

  try {
    // BigInt handles decimal and 0x-prefixed hex strings as well as numbers.
    const parsed = Number(BigInt(chainId as string | number | bigint))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  } catch {
    return undefined
  }
}
