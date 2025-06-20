import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { Address } from '@solana/kit'

const ACCOUNT_SPACE_CACHE = new Map<Address, bigint>()

export const getAccountOccupiedSpace = async (
  address: Address,
  provider: SolanaProvider
): Promise<bigint> => {
  const cached = ACCOUNT_SPACE_CACHE.get(address)

  if (cached) {
    return cached
  }

  const accountInfo = await provider.getAccountInfo(address).send()
  const space = accountInfo.value?.space ?? 0n
  ACCOUNT_SPACE_CACHE.set(address, space)

  return space
}
