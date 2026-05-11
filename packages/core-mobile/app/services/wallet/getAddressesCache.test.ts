import { NetworkVMType } from '@avalabs/vm-module-types'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import {
  getAddressesCache,
  setAddressesCache,
  clearAddressesCache,
  getInFlightAddressesFetch,
  setInFlightAddressesFetch,
  clearInFlightAddressesFetch
} from './getAddressesCache'

const sampleAvmResponse: GetAddressesResponse = {
  networkType: 'AVM',
  externalAddresses: [{ address: 'X-avax1abc', index: 0, hasActivity: true }],
  internalAddresses: []
}

const samplePvmResponse: GetAddressesResponse = {
  networkType: 'PVM',
  externalAddresses: [{ address: 'P-avax1abc', index: 0, hasActivity: false }],
  internalAddresses: []
}

describe('getAddressesCache', () => {
  beforeEach(() => {
    clearAddressesCache()
  })

  it('returns undefined for an unseen key', () => {
    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBeUndefined()
  })

  it('returns the stored value for a previously-set key', () => {
    setAddressesCache(
      {
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      },
      sampleAvmResponse
    )

    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBe(sampleAvmResponse)
  })

  it('keys distinct on networkType', () => {
    setAddressesCache(
      {
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      },
      sampleAvmResponse
    )
    setAddressesCache(
      {
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.PVM,
        isTestnet: false,
        onlyWithActivity: false
      },
      samplePvmResponse
    )

    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBe(sampleAvmResponse)
    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.PVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBe(samplePvmResponse)
  })

  it('keys distinct on isTestnet and onlyWithActivity', () => {
    setAddressesCache(
      {
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      },
      sampleAvmResponse
    )

    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: true,
        onlyWithActivity: false
      })
    ).toBeUndefined()
    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: true
      })
    ).toBeUndefined()
  })

  it('clearAddressesCache wipes everything', () => {
    setAddressesCache(
      {
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      },
      sampleAvmResponse
    )

    clearAddressesCache()

    expect(
      getAddressesCache({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBeUndefined()
  })
})

describe('getAddressesCache — in-flight promise tracking', () => {
  beforeEach(() => {
    clearAddressesCache()
  })

  it('returns undefined when no in-flight fetch for a key', () => {
    expect(
      getInFlightAddressesFetch({
        extendedPublicKey: 'xpub-1',
        networkType: NetworkVMType.AVM,
        isTestnet: false,
        onlyWithActivity: false
      })
    ).toBeUndefined()
  })

  it('returns the registered promise for an in-flight key', async () => {
    const key = {
      extendedPublicKey: 'xpub-1',
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    } as const

    const inflight = Promise.resolve(sampleAvmResponse)
    setInFlightAddressesFetch(key, inflight)

    expect(getInFlightAddressesFetch(key)).toBe(inflight)
    // Cleanup so a hanging unresolved promise can't leak between tests
    clearInFlightAddressesFetch(key)
  })

  it('clearInFlightAddressesFetch removes a single key without touching others', () => {
    const keyA = {
      extendedPublicKey: 'xpub-A',
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    } as const
    const keyB = {
      extendedPublicKey: 'xpub-B',
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    } as const

    const promiseA = Promise.resolve(sampleAvmResponse)
    const promiseB = Promise.resolve(samplePvmResponse)
    setInFlightAddressesFetch(keyA, promiseA)
    setInFlightAddressesFetch(keyB, promiseB)

    clearInFlightAddressesFetch(keyA)

    expect(getInFlightAddressesFetch(keyA)).toBeUndefined()
    expect(getInFlightAddressesFetch(keyB)).toBe(promiseB)

    clearInFlightAddressesFetch(keyB)
  })

  it('clearAddressesCache also wipes in-flight promises', () => {
    const key = {
      extendedPublicKey: 'xpub-1',
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    } as const

    setInFlightAddressesFetch(key, Promise.resolve(sampleAvmResponse))
    clearAddressesCache()

    expect(getInFlightAddressesFetch(key)).toBeUndefined()
  })
})
