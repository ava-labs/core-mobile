import { WalletType } from 'services/wallet/types'
import * as profileApiClientModule from 'utils/api/generated/profileApi.client'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import WalletService from './WalletService'

const avmWithActivityResponse: GetAddressesResponse = {
  networkType: 'AVM',
  externalAddresses: [{ address: 'X-avax1', index: 0, hasActivity: true }],
  internalAddresses: []
}

const pvmEmptyResponse: GetAddressesResponse = {
  networkType: 'PVM',
  externalAddresses: [],
  internalAddresses: []
}

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

jest.mock('utils/api/generated/profileApi.client', () => ({
  __esModule: true,
  postV1GetAddresses: jest.fn()
}))

jest.mock('utils/api/clients/profileApiClient', () => ({
  profileApiClient: {}
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

const mockPostV1GetAddresses =
  profileApiClientModule.postV1GetAddresses as jest.Mock

describe('WalletService.hasActivityFromXpubXP', () => {
  beforeEach(() => {
    mockPostV1GetAddresses.mockReset()
  })

  afterEach(() => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockRestore()
  })

  it('reuses one XP xpub for AVM and PVM activity lookups', async () => {
    const getRawXpubXPSpy = jest
      .spyOn(WalletService, 'getRawXpubXP')
      .mockResolvedValue('xpub-123')

    // AVM and PVM requests run in parallel; mockResolvedValueOnce order is not stable across environments.
    mockPostV1GetAddresses.mockImplementation(
      (options: { body: { networkType: string } }) => {
        if (options.body.networkType === 'AVM') {
          return Promise.resolve({ data: avmWithActivityResponse })
        }
        if (options.body.networkType === 'PVM') {
          return Promise.resolve({ data: pvmEmptyResponse })
        }
        return Promise.resolve({ data: pvmEmptyResponse })
      }
    )

    const hasActivity = await WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.MNEMONIC,
      accountIndex: 2,
      isTestnet: false
    })

    expect(hasActivity).toBe(true)
    expect(getRawXpubXPSpy).toHaveBeenCalledTimes(1)
    expect(mockPostV1GetAddresses).toHaveBeenCalledTimes(2)
    expect(mockPostV1GetAddresses).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          extendedPublicKey: 'xpub-123',
          networkType: 'AVM',
          onlyWithActivity: true
        })
      })
    )
    expect(mockPostV1GetAddresses).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          extendedPublicKey: 'xpub-123',
          networkType: 'PVM',
          onlyWithActivity: true
        })
      })
    )
  })

  it('skips non-primary Keystone accounts until per-account XP xpubs are supported', async () => {
    const getRawXpubXPSpy = jest.spyOn(WalletService, 'getRawXpubXP')

    const hasActivity = await WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.KEYSTONE,
      accountIndex: 1,
      isTestnet: false
    })

    expect(hasActivity).toBe(false)
    expect(getRawXpubXPSpy).not.toHaveBeenCalled()
    expect(mockPostV1GetAddresses).not.toHaveBeenCalled()
  })

  it('returns as soon as one XP network reports activity', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-123')

    const pendingPvmResponse = createDeferred<{ data: GetAddressesResponse }>()

    mockPostV1GetAddresses.mockImplementation(
      (options: { body: { networkType: string } }) => {
        if (options.body.networkType === 'AVM') {
          return Promise.resolve({ data: avmWithActivityResponse })
        }
        if (options.body.networkType === 'PVM') {
          return pendingPvmResponse.promise
        }
        return Promise.resolve({ data: pvmEmptyResponse })
      }
    )

    const hasActivityPromise = WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.MNEMONIC,
      accountIndex: 2,
      isTestnet: false
    })

    const resultOrTimeout = await Promise.race([
      hasActivityPromise,
      new Promise<'timeout'>(resolve =>
        setTimeout(() => resolve('timeout'), 100)
      )
    ])

    pendingPvmResponse.resolve({ data: pvmEmptyResponse })

    expect(resultOrTimeout).toBe(true)
  })
})
