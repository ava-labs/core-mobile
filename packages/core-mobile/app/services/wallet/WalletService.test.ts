import { WalletType } from 'services/wallet/types'
import * as profileApiClientModule from 'utils/api/generated/profileApi.client'
import WalletService from './WalletService'

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
    jest.clearAllMocks()
  })

  it('reuses one XP xpub for AVM and PVM activity lookups', async () => {
    const getRawXpubXPSpy = jest
      .spyOn(WalletService, 'getRawXpubXP')
      .mockResolvedValue('xpub-123')

    mockPostV1GetAddresses
      .mockResolvedValueOnce({
        data: {
          networkType: 'AVM',
          externalAddresses: [
            { address: 'X-avax1', index: 0, hasActivity: true }
          ],
          internalAddresses: []
        }
      })
      .mockResolvedValueOnce({
        data: {
          networkType: 'PVM',
          externalAddresses: [],
          internalAddresses: []
        }
      })

    const hasActivity = await WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.MNEMONIC,
      accountIndex: 2,
      isTestnet: false
    })

    expect(hasActivity).toBe(true)
    expect(getRawXpubXPSpy).toHaveBeenCalledTimes(1)
    expect(mockPostV1GetAddresses).toHaveBeenCalledTimes(2)
    expect(mockPostV1GetAddresses).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        body: expect.objectContaining({
          extendedPublicKey: 'xpub-123',
          networkType: 'AVM',
          onlyWithActivity: true
        })
      })
    )
    expect(mockPostV1GetAddresses).toHaveBeenNthCalledWith(
      2,
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

    const pendingPvmResponse = createDeferred<{
      data: {
        networkType: string
        externalAddresses: Array<{
          address: string
          index: number
          hasActivity: boolean
        }>
        internalAddresses: Array<{
          address: string
          index: number
          hasActivity: boolean
        }>
      }
    }>()

    mockPostV1GetAddresses
      .mockResolvedValueOnce({
        data: {
          networkType: 'AVM',
          externalAddresses: [
            { address: 'X-avax1', index: 0, hasActivity: true }
          ],
          internalAddresses: []
        }
      })
      .mockImplementationOnce(() => pendingPvmResponse.promise)

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

    pendingPvmResponse.resolve({
      data: {
        networkType: 'PVM',
        externalAddresses: [],
        internalAddresses: []
      }
    })

    expect(resultOrTimeout).toBe(true)
  })
})
