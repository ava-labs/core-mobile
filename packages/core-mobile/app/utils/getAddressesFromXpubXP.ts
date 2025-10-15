import { z } from 'zod'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { StorageKey } from 'resources/Constants'
import { WalletType, NetworkAddresses } from 'services/wallet/types'
import Logger from './Logger'
import { commonStorage } from './mmkv'
import { stripXPPrefix } from './stripXPPrefix'

type FlattenedAddresses = {
  external: string[]
  internal: string[]
}

const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

const getAddressesInRangeResultSchema = z.object({
  external: z.array(z.string()),
  internal: z.array(z.string())
})

const addressesInRangeCacheSchema = z.object({
  expiresAtMs: z.number(),
  addresses: getAddressesInRangeResultSchema
})

const isResponseLonger = (
  response1: NetworkAddresses,
  response2: NetworkAddresses
): boolean => {
  return response1.externalAddresses.length > response2.externalAddresses.length
}

const flattenAddresses = (
  pResponse: NetworkAddresses,
  xResponse: NetworkAddresses
): FlattenedAddresses => {
  const longerResponse = isResponseLonger(pResponse, xResponse)
    ? pResponse
    : xResponse

  const external = Array.from(
    new Set(longerResponse.externalAddresses.map(a => stripXPPrefix(a.address)))
  )

  const internal = Array.from(
    new Set(xResponse.internalAddresses.map(a => stripXPPrefix(a.address)))
  )

  return { external, internal }
}

export const getAddressesFromXpubXP = async ({
  isDeveloperMode,
  walletId,
  walletType
}: {
  isDeveloperMode: boolean
  walletId: string
  walletType: WalletType
}): Promise<{ external: string[]; internal: string[] }> => {
  const cacheKey = `${StorageKey.ADDRESSES_IN_RANGE}.${walletId}.${isDeveloperMode}`
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

  const avmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.AVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity: false
  })

  const pvmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.PVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity: false
  })

  const addresses = flattenAddresses(pvmAddresses, avmAddresses)

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
      'Failed to persist getAddressesFromXpubXP response to local storage',
      error
    )
  }

  return addresses
}
