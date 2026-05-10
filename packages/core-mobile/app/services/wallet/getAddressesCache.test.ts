import { NetworkVMType } from '@avalabs/vm-module-types'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import {
  getAddressesCache,
  setAddressesCache,
  clearAddressesCache
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
