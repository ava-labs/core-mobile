import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { useWallet } from 'hooks/useWallet'
import BiometricsSDK from 'utils/BiometricsSDK'
import { WalletType } from 'services/wallet/types'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { appReducer, WalletState } from 'store/app'
import { walletsReducer } from 'store/wallet/slice'

// Mock encryption dependencies
jest.mock('react-native-aes-crypto', () => ({
  randomKey: jest.fn().mockResolvedValue('mock-random-key'),
  encrypt: jest.fn().mockResolvedValue('mock-encrypted-data'),
  decrypt: jest.fn().mockResolvedValue('mock-decrypted-data')
}))
jest.mock('react-native-argon2', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ rawHash: 'mock-raw-hash' })
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    init: jest.fn()
  }
}))

jest.mock('utils/uuid', () => ({
  uuid: jest.fn()
}))

const createTestStore = () => {
  return configureStore({
    reducer: {
      app: appReducer,
      wallet: walletsReducer
    },
    preloadedState: {
      app: {
        isReady: true,
        isLocked: true,
        appState: 'active',
        walletState: WalletState.NONEXISTENT,
        walletType: WalletType.MNEMONIC
      },
      wallet: {
        wallets: {},
        activeWalletId: null
      }
    }
  })
}

jest.mock('uuid', () => ({
  v4: jest.fn()
}))

describe('useWallet', () => {
  const mockWalletId = 'test-wallet-1'
  const mockMnemonic =
    'clown below snake memory pet neither jungle sunny crisp cram nominee insane thing tiger adult upset juice debate gym govern rent goddess dentist civil'
  const mockPin = '1234'
  const store = createTestStore()

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    Provider({ store, children })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('utils/uuid').uuid as jest.Mock).mockReturnValue(mockWalletId)
  })

  describe('onPinCreated', () => {
    it('should create wallet with PIN and return the walletId', async () => {
      jest.spyOn(BiometricsSDK, 'storeWalletSecret').mockResolvedValue(true)
      jest.spyOn(BiometricsSDK, 'canUseBiometry').mockResolvedValue(true)

      const { result } = renderHook(() => useWallet(), { wrapper })

      let response
      await act(async () => {
        response = await result.current.onPinCreated({
          mnemonic: mockMnemonic,
          pin: mockPin,
          walletType: WalletType.MNEMONIC
        })
      })

      expect(BiometricsSDK.storeWalletSecret).toHaveBeenCalledWith(
        mockWalletId,
        mockMnemonic
      )
      expect(response).toBe(mockWalletId)
    })

    it('should throw error when storing wallet fails', async () => {
      jest.spyOn(BiometricsSDK, 'storeWalletSecret').mockResolvedValue(false)

      const { result } = renderHook(() => useWallet(), { wrapper })

      await act(async () => {
        await expect(
          result.current.onPinCreated({
            mnemonic: mockMnemonic,
            pin: mockPin,
            walletType: WalletType.MNEMONIC
          })
        ).rejects.toThrow('Failed to store wallet with PIN')
      })
    })
  })

  describe('unlock', () => {
    it('should unlock wallet successfully', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper })

      await act(async () => {
        await result.current.unlock({ mnemonic: mockMnemonic })
      })
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper })

      await act(async () => {
        await result.current.login(WalletType.MNEMONIC)
      })

      // Add any necessary assertions based on your login implementation
    })
  })
})
