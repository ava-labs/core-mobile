import { WalletType } from 'services/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { RootState } from 'store/types'
import { storeWalletWithPin } from './thunks'

jest.mock('utils/BiometricsSDK')

describe('wallet thunks', () => {
  // Mock initial state
  const mockState: Partial<RootState> = {
    wallet: {
      wallets: {},
      activeWalletId: null
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeWalletWithPin', () => {
    const mockParams = {
      walletId: 'test-wallet-1',
      encryptedWalletKey: 'encrypted-key',
      isResetting: false,
      type: WalletType.MNEMONIC
    }

    it('should successfully store wallet with PIN', async () => {
      const keychainResult = {
        service: 'test-service',
        storage: 'keychain'
      }
      // Mock successful storage
      jest
        .spyOn(BiometricsSDK, 'storeWalletWithPin')
        .mockResolvedValue(keychainResult)

      const mockGetState = jest.fn().mockReturnValue(mockState)
      const result = await storeWalletWithPin(mockParams)(
        jest.fn(),
        mockGetState,
        undefined
      )

      expect(BiometricsSDK.storeWalletWithPin).toHaveBeenCalledWith(
        mockParams.walletId,
        mockParams.encryptedWalletKey,
        mockParams.isResetting
      )

      expect(result.payload).toEqual({
        id: mockParams.walletId,
        name: 'MNEMONIC Wallet 1',
        type: mockParams.type
      })
    })

    it('should throw error when storage fails', async () => {
      // Mock failed storage
      jest.spyOn(BiometricsSDK, 'storeWalletWithPin').mockResolvedValue(false)

      const mockGetState = jest.fn().mockReturnValue(mockState)
      const result = (await storeWalletWithPin(mockParams)(
        jest.fn(),
        mockGetState,
        undefined
      )) as { type: string; error: { message: string } }

      expect(result.type).toBe('wallet/storeWalletWithPin/rejected')
      expect(result.error.message).toBe(
        'Failed to store wallet in BiometricsSDK'
      )
    })
  })
})
