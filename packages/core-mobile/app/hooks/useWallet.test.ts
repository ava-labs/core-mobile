import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { useWallet } from 'hooks/useWallet'
import BiometricsSDK from 'utils/BiometricsSDK'
import { WalletType } from 'services/wallet/types'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { appReducer, WalletState } from 'store/app'
import { walletsReducer } from 'store/wallet/slice'
import WalletService from 'services/wallet/WalletService'

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

// Mock keychain result
const keychainResult = {
  service: 'test-service',
  storage: 'keychain'
}

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
    it('should create wallet with PIN and return useBiometry when biometry is available', async () => {
      jest
        .spyOn(BiometricsSDK, 'storeWalletWithPin')
        .mockResolvedValue(keychainResult)
      jest.spyOn(BiometricsSDK, 'canUseBiometry').mockResolvedValue(true)

      const { result } = renderHook(() => useWallet(), { wrapper })

      let response
      await act(async () => {
        response = await result.current.onPinCreated({
          mnemonic: mockMnemonic,
          pin: mockPin,
          isResetting: false,
          walletType: WalletType.MNEMONIC
        })
      })

      expect(BiometricsSDK.storeWalletWithPin).toHaveBeenCalledWith(
        mockWalletId,
        expect.any(String),
        false
      )
      expect(response).toBe('useBiometry')
    })

    it('should create wallet with PIN and return enterWallet when biometry is not available', async () => {
      jest
        .spyOn(BiometricsSDK, 'storeWalletWithPin')
        .mockResolvedValue(keychainResult)
      jest.spyOn(BiometricsSDK, 'canUseBiometry').mockResolvedValue(false)

      const { result } = renderHook(() => useWallet(), { wrapper })

      let response
      await act(async () => {
        response = await result.current.onPinCreated({
          mnemonic: mockMnemonic,
          pin: mockPin,
          isResetting: false,
          walletType: WalletType.MNEMONIC
        })
      })

      expect(BiometricsSDK.storeWalletWithPin).toHaveBeenCalledWith(
        mockWalletId,
        expect.any(String),
        false
      )
      expect(response).toBe('enterWallet')
    })

    it('should throw error when storing wallet fails', async () => {
      jest.spyOn(BiometricsSDK, 'storeWalletWithPin').mockResolvedValue(false)

      const { result } = renderHook(() => useWallet(), { wrapper })

      await act(async () => {
        await expect(
          result.current.onPinCreated({
            mnemonic: mockMnemonic,
            pin: mockPin,
            isResetting: false,
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

      expect(WalletService.init).toHaveBeenCalledWith({
        mnemonic: mockMnemonic,
        walletType: WalletType.MNEMONIC,
        isLoggingIn: false
      })
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper })

      await act(async () => {
        await result.current.login(mockMnemonic, WalletType.MNEMONIC)
      })

      // Add any necessary assertions based on your login implementation
    })
  })
})
