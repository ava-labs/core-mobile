import { WalletType } from 'services/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { RootState } from 'store/types'
import { storeWallet } from './thunks'

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
})
