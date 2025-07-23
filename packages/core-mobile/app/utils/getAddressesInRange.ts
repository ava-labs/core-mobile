import { z } from 'zod'
import { getCorrectedLimit } from 'store/rpc/handlers/avalanche_getAddressesInRange/utils'
import WalletService from 'services/wallet/WalletService'
import { StorageKey } from 'resources/Constants'
import { WalletType } from 'services/wallet/types'
import Logger from './Logger'
import { commonStorage } from './mmkv'

const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

const getAddressesInRangeResultSchema = z.object({
  external: z.array(z.string()),
  internal: z.array(z.string())
})

const addressesInRangeCacheSchema = z.object({
  expiresAtMs: z.number(),
  addresses: getAddressesInRangeResultSchema
})

export type AddressesParams = {
  externalStart: number
  internalStart: number
  externalLimit: number
  internalLimit: number
}

export const getAddressesInRange = async ({
  isDeveloperMode,
  walletId,
  walletType,
  params
}: {
  isDeveloperMode: boolean
  walletId: string
  walletType: WalletType
  params: AddressesParams
}): Promise<{ external: string[]; internal: string[] }> => {
  //TODO: this should be uncommented but migration is needed. Also, currently cache is never cleared which imposes a problem of storage bloating.

  // const cacheKey = `${StorageKey.ADDRESSES_IN_RANGE}.${walletId}.${isDeveloperMode}.${JSON.stringify(
  //   params
  // )}`
  const cacheKey = `${
    StorageKey.ADDRESSES_IN_RANGE
  }.${isDeveloperMode}.${JSON.stringify(params)}`
  const cachedResult = commonStorage.getString(cacheKey)
  const parsedCachedResult = addressesInRangeCacheSchema.safeParse(
    JSON.parse(cachedResult ?? '{}')
  )
  if (
    parsedCachedResult.success &&
    new Date().getTime() < parsedCachedResult.data.expiresAtMs
  ) {
    return parsedCachedResult.data.addresses
  }

  const addresses: { external: string[]; internal: string[] } = {
    external: [],
    internal: []
  }

  const correctedExternalLimit = getCorrectedLimit(params.externalLimit)
  const correctedInternalLimit = getCorrectedLimit(params.internalLimit)

  const externalIndices = Array.from(
    { length: correctedExternalLimit },
    (_, i) => params.externalStart + i
  )
  addresses.external = (
    await WalletService.getAddressesByIndices({
      walletId,
      walletType,
      indices: externalIndices ?? [],
      chainAlias: 'X',
      isChange: false,
      isTestnet: isDeveloperMode
    })
  ).map(address => address.split('-')[1] as string)

  const internalIndices = Array.from(
    { length: correctedInternalLimit },
    (_, i) => params.internalStart + i
  )

  addresses.internal = (
    await WalletService.getAddressesByIndices({
      walletId,
      walletType,
      indices: internalIndices ?? [],
      chainAlias: 'X',
      isChange: true,
      isTestnet: isDeveloperMode
    })
  ).map(address => address.split('-')[1] as string)

  try {
    commonStorage.set(
      cacheKey,
      JSON.stringify({
        addresses,
        expiresAtMs: new Date().getTime() + CACHE_DURATION
      })
    )
  } catch (error) {
    Logger.error(
      'Failed to persist getAddressesInRange response to local storage',
      error
    )
  }
  return addresses
}
