import { WalletType } from 'services/wallet/types'
import type { Wallet } from 'services/wallet/types'
import WalletFactory from './WalletFactory'

// Stub out the entire wallet creation pipeline — we only care about
// whether getOrCreateWallet reuses instances vs createWallet makes fresh ones.
const mockWallet: Wallet = {
  signMessage: jest.fn(),
  signBtcTransaction: jest.fn(),
  signAvalancheTransaction: jest.fn(),
  signEvmTransaction: jest.fn(),
  signSvmTransaction: jest.fn(),
  getPublicKeyFor: jest.fn().mockResolvedValue('pubkey-abc')
}

jest.mock('seedless/services/wallet/SeedlessWallet')
jest.mock('seedless/services/SeedlessService')
jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    loadWalletSecret: jest
      .fn()
      .mockResolvedValue({ success: true, value: 'test-mnemonic' })
  }
}))
jest.mock('seedless/services/storage/SeedlessPubKeysStorage')
jest.mock('features/keystone/storage/KeystoneDataStorage')
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))

describe('WalletFactory', () => {
  beforeEach(() => {
    WalletFactory.cache.clearAll()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getOrCreateWallet', () => {
    it('returns cached instance on second call', async () => {
      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockResolvedValue(mockWallet)

      const first = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })
      const second = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      expect(first).toBe(second)
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('creates separate instances for different walletIds', async () => {
      const walletA: Wallet = { ...mockWallet }
      const walletB: Wallet = { ...mockWallet }

      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockResolvedValueOnce(walletA)
        .mockResolvedValueOnce(walletB)

      const first = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })
      const second = await WalletFactory.getOrCreateWallet({
        walletId: 'w2',
        walletType: WalletType.MNEMONIC
      })

      expect(first).toBe(walletA)
      expect(second).toBe(walletB)
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    it('deduplicates concurrent calls for the same walletId', async () => {
      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockResolvedValue(mockWallet)

      // Fire two calls concurrently without awaiting either first
      const [first, second] = await Promise.all([
        WalletFactory.getOrCreateWallet({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC
        }),
        WalletFactory.getOrCreateWallet({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC
        })
      ])

      expect(first).toBe(second)
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('retries after a failed creation', async () => {
      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockRejectedValueOnce(new Error('keychain error'))
        .mockResolvedValueOnce(mockWallet)

      await expect(
        WalletFactory.getOrCreateWallet({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC
        })
      ).rejects.toThrow('keychain error')

      // In-flight promise should be cleaned up — next call retries
      const result = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      expect(result).toBe(mockWallet)
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    it('returns fresh instance after clearWallet', async () => {
      const walletA: Wallet = { ...mockWallet }
      const walletB: Wallet = { ...mockWallet }

      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockResolvedValueOnce(walletA)
        .mockResolvedValueOnce(walletB)

      const first = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      WalletFactory.cache.clearWallet('w1')

      const second = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      expect(first).toBe(walletA)
      expect(second).toBe(walletB)
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    it('concurrent callers both reject when creation fails', async () => {
      jest
        .spyOn(WalletFactory, 'createWallet')
        .mockRejectedValueOnce(new Error('keychain locked'))

      const results = await Promise.allSettled([
        WalletFactory.getOrCreateWallet({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC
        }),
        WalletFactory.getOrCreateWallet({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC
        })
      ])

      expect(results[0]?.status).toBe('rejected')
      expect(results[1]?.status).toBe('rejected')
      expect((results[0] as PromiseRejectedResult).reason.message).toBe(
        'keychain locked'
      )
      expect((results[1] as PromiseRejectedResult).reason.message).toBe(
        'keychain locked'
      )
    })

    it('clearWallet during in-flight creation prevents re-caching', async () => {
      let resolveCreation!: (wallet: Wallet) => void
      const creationPromise = new Promise<Wallet>(resolve => {
        resolveCreation = resolve
      })
      const staleWallet: Wallet = { ...mockWallet }
      const freshWallet: Wallet = { ...mockWallet }

      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockReturnValueOnce(creationPromise)
        .mockResolvedValueOnce(freshWallet)

      // Start creation — it's now in-flight
      const firstPromise = WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      // Clear while still in-flight (simulates lock/remove flow)
      WalletFactory.cache.clearWallet('w1')

      // Resolve the in-flight creation after the clear
      resolveCreation(staleWallet)

      // The stale promise rejects because the in-flight entry was invalidated
      await firstPromise.catch(() => undefined)

      // The stale wallet should NOT be in the instance cache
      // A new call should trigger fresh creation
      const second = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      expect(second).toBe(freshWallet)
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    it('clearAll during in-flight creation prevents re-caching', async () => {
      let resolveCreation!: (wallet: Wallet) => void
      const creationPromise = new Promise<Wallet>(resolve => {
        resolveCreation = resolve
      })
      const staleWallet: Wallet = { ...mockWallet }
      const freshWallet: Wallet = { ...mockWallet }

      const createSpy = jest
        .spyOn(WalletFactory, 'createWallet')
        .mockReturnValueOnce(creationPromise)
        .mockResolvedValueOnce(freshWallet)

      const firstPromise = WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      // clearAll while in-flight (simulates logout)
      WalletFactory.cache.clearAll()

      resolveCreation(staleWallet)

      // The stale promise rejects because the in-flight entry was invalidated
      await firstPromise.catch(() => undefined)

      const second = await WalletFactory.getOrCreateWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      expect(second).toBe(freshWallet)
      expect(createSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('createWallet', () => {
    it('loads wallet secret from keychain on every call (no caching)', async () => {
      const BiometricsSDK = require('utils/BiometricsSDK').default

      const first = await WalletFactory.createWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })
      const second = await WalletFactory.createWallet({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })

      // Each call should hit BiometricsSDK — no caching at this layer
      expect(BiometricsSDK.loadWalletSecret).toHaveBeenCalledTimes(2)
      expect(first).not.toBe(second)
    })
  })
})
