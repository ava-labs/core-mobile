import { SolanaProvider } from '@avalabs/core-wallets-sdk'

const RENT_EXEMPT_CACHE = new Map<bigint, bigint>()

export const getRentExemptMinimum = async (
  space: bigint,
  provider: SolanaProvider
): Promise<bigint> => {
  const cached = RENT_EXEMPT_CACHE.get(space)

  if (cached) {
    return cached
  }

  const rentExemptMinimum = await provider
    .getMinimumBalanceForRentExemption(0n)
    .send()

  RENT_EXEMPT_CACHE.set(0n, rentExemptMinimum)

  return rentExemptMinimum
}
