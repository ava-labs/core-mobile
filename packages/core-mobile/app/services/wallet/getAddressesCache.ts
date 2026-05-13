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
const inFlight = new Map<string, Promise<GetAddressesResponse>>()
let epoch = 0

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
  inFlight.clear()
  epoch += 1
}

export const getAddressesCacheEpoch = (): number => epoch

export const getInFlightAddressesFetch = (
  key: CacheKey
): Promise<GetAddressesResponse> | undefined => inFlight.get(serializeKey(key))

export const setInFlightAddressesFetch = (
  key: CacheKey,
  promise: Promise<GetAddressesResponse>
): void => {
  inFlight.set(serializeKey(key), promise)
}

// Compare-and-delete: only remove the entry if it still matches `promise`.
// Guards against a stale `finally` from a pre-clear fetch deleting the
// in-flight registration of a *newer* fetch for the same key after
// `clearAddressesCache()` wiped the map in between.
export const clearInFlightAddressesFetch = (
  key: CacheKey,
  promise: Promise<GetAddressesResponse>
): void => {
  const serialized = serializeKey(key)
  if (inFlight.get(serialized) === promise) {
    inFlight.delete(serialized)
  }
}
