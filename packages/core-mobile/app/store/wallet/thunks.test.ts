import { WalletType } from 'services/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import AccountsService from 'services/account/AccountsService'
import { RootState } from 'store/types'
import { uuid } from 'utils/uuid'
import { storeWallet, importMnemonicWalletAndAccount } from './thunks'

jest.mock('utils/BiometricsSDK')
jest.mock('services/account/AccountsService')
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('utils/uuid', () => {
  const fn = jest.fn().mockReturnValue('mock-uuid')
  return { uuid: fn }
})
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: jest.fn().mockReturnValue(false)
}))

describe('wallet thunks', () => {
  // Mock initial state
  const mockState: Partial<RootState> = {
    wallet: {
      wallets: {},
      activeWalletId: null,
      isMigratingActiveAccounts: false
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeWallet', () => {
    const mockParams = {
      walletId: 'test-wallet-1',
      walletSecret: 'encrypted-key',
      type: WalletType.MNEMONIC
    }

    it('should successfully store wallet with PIN', async () => {
      // Mock successful storage
      jest.spyOn(BiometricsSDK, 'storeWalletSecret').mockResolvedValue(true)

      const mockGetState = jest.fn().mockReturnValue(mockState)
      const result = await storeWallet(mockParams)(
        jest.fn(),
        mockGetState,
        undefined
      )

      expect(BiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        mockParams.walletId,
        mockParams.walletSecret
      )

      expect(result.payload).toEqual({
        id: mockParams.walletId,
        name: 'Wallet 1',
        type: mockParams.type
      })
    })

    it('should throw error when storage fails', async () => {
      // Mock failed storage
      jest.spyOn(BiometricsSDK, 'storeWalletSecret').mockResolvedValue(false)

      const mockGetState = jest.fn().mockReturnValue(mockState)
      const result = (await storeWallet(mockParams)(
        jest.fn(),
        mockGetState,
        undefined
      )) as { type: string; error: { message: string } }

      expect(result.type).toBe('wallet/storeWallet/rejected')
      expect(result.error.message).toBe(
        'Failed to store wallet in BiometricsSDK'
      )
    })
  })

  describe('importMnemonicWalletAndAccount', () => {
    const mockAddresses = {
      EVM: '0xabc',
      BITCOIN: 'bc1test',
      AVM: 'X-avaxtest',
      PVM: 'P-avaxtest',
      SVM: 'solantest',
      CoreEth: '0xcoretest'
    }

    beforeEach(() => {
      ;(uuid as jest.Mock)
        .mockReturnValueOnce('mock-wallet-uuid')
        .mockReturnValueOnce('mock-account-uuid')
      jest.spyOn(BiometricsSDK, 'storeWalletSecret').mockResolvedValue(true)
      ;(AccountsService.getAddresses as jest.Mock).mockResolvedValue(
        mockAddresses
      )
    })

    it('should create Account #0 and dispatch it', async () => {
      const mockDispatch = jest.fn().mockImplementation(action => {
        if (typeof action === 'function') {
          return action(mockDispatch, () => mockState, undefined)
        }
        return { unwrap: () => Promise.resolve(action.payload ?? action) }
      })
      const mockGetState = jest.fn().mockReturnValue(mockState)

      await importMnemonicWalletAndAccount({
        mnemonic: 'test mnemonic phrase',
        name: 'My Wallet'
      })(mockDispatch, mockGetState, undefined)

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setAccount')
        })
      )
    })

    it('should return walletId for downstream account discovery', async () => {
      const mockDispatch = jest.fn().mockImplementation(action => {
        if (typeof action === 'function') {
          return action(mockDispatch, () => mockState, undefined)
        }
        return { unwrap: () => Promise.resolve(action.payload ?? action) }
      })
      const mockGetState = jest.fn().mockReturnValue(mockState)

      const result = await importMnemonicWalletAndAccount({
        mnemonic: 'test mnemonic phrase'
      })(mockDispatch, mockGetState, undefined)

      expect(result.payload).toEqual({ walletId: 'mock-wallet-uuid' })
    })
  })
})
