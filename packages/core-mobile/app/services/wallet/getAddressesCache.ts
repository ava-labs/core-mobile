import { NetworkVMType } from '@avalabs/vm-module-types'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'

type CacheKey = {
  extendedPublicKey: string
  networkType: NetworkVMType.AVM | NetworkVMType.PVM
  isTestnet: boolean
  onlyWithActivity: boolean
}

const serializeKey = (key: CacheKey): string =>
  `${key.extendedPublicKey}|${key.networkType}|${key.isTestnet ? 't' : 'm'}|${
    key.onlyWithActivity ? 'a' : 'all'
  }`

const cache = new Map<string, GetAddressesResponse>()

export const getAddressesCache = (
  key: CacheKey
): GetAddressesResponse | undefined => cache.get(serializeKey(key))

export const setAddressesCache = (
  key: CacheKey,
  value: GetAddressesResponse
): void => {
  cache.set(serializeKey(key), value)
}

export const clearAddressesCache = (): void => {
  cache.clear()
}
