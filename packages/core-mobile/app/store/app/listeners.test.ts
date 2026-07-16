import {
  configureStore,
  createListenerMiddleware,
  type Store
} from '@reduxjs/toolkit'
import type { AppStartListening, RootState } from 'store/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import {
  appReducer,
  initialState,
  onRehydrationComplete,
  selectWalletState
} from './slice'
import { WalletState } from './types'
import { addAppListeners } from './listeners'

// init()/clearData() touch a lot of platform + storage singletons. Stub them so
// the reconciliation logic under test runs in isolation.
jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    warmup: jest.fn(() => Promise.resolve()),
    hasWalletData: jest.fn(() => Promise.resolve(true)),
    clearAllData: jest.fn(() => Promise.resolve())
  }
}))
jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: { getFontScale: jest.fn(() => Promise.resolve(1)) }
}))
jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: { hide: jest.fn() }
}))
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('security/SecureStorageService', () => ({
  __esModule: true,
  default: { clearAll: jest.fn(() => Promise.resolve()) }
}))
jest.mock('store/reduxStorage', () => ({
  reduxStorage: { clear: jest.fn(() => Promise.resolve()) }
}))
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { clear: jest.fn(() => Promise.resolve()) }
}))
jest.mock('utils/mmkv', () => ({ commonStorage: { clearAll: jest.fn() } }))
jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: { clear: jest.fn() }
}))
jest.mock('services/wallet/getAddressesCache', () => ({
  clearAddressesCache: jest.fn()
}))
jest.mock('store/listenerReconcilers', () => ({
  listenerReconcilerExecutor: { executeAll: jest.fn() }
}))
jest.mock('store/settings/securityPrivacy', () => ({
  selectLockWalletWithPIN: jest.fn(() => true)
}))
jest.mock('features/accountSettings/store', () => ({
  useDisableLockAppStore: { getState: () => ({ disableLockApp: false }) }
}))

const mockHasWalletData = BiometricsSDK.hasWalletData as jest.Mock

const listenerMiddleware = createListenerMiddleware()

const setupStore = (walletState: WalletState) => {
  listenerMiddleware.clearListeners()
  const store = configureStore({
    reducer: { app: appReducer },
    preloadedState: { app: { ...initialState, walletState } },
    middleware: gDM =>
      gDM({ serializableCheck: false }).prepend(listenerMiddleware.middleware)
  })
  addAppListeners(listenerMiddleware.startListening as AppStartListening)
  return store
}

const walletStateOf = (store: Store): WalletState =>
  selectWalletState(store.getState() as RootState)

const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('app listeners — wallet state reconciliation on launch', () => {
  it('routes to onboarding (NONEXISTENT) when a wallet is persisted but its keychain data is gone', async () => {
    // Repro CP-14585: an interrupted seedless wallet deletion leaves walletState
    // INACTIVE while the keychain no longer holds any credential.
    mockHasWalletData.mockResolvedValue(false)
    const store = setupStore(WalletState.INACTIVE)

    store.dispatch(onRehydrationComplete())
    await flush()

    expect(walletStateOf(store)).toBe(WalletState.NONEXISTENT)
  })

  it('keeps a locked wallet on the PIN screen (INACTIVE) when its keychain data is intact', async () => {
    mockHasWalletData.mockResolvedValue(true)
    const store = setupStore(WalletState.INACTIVE)

    store.dispatch(onRehydrationComplete())
    await flush()

    expect(walletStateOf(store)).toBe(WalletState.INACTIVE)
  })

  it('downgrades an ACTIVE wallet to INACTIVE on launch when its keychain data is intact', async () => {
    mockHasWalletData.mockResolvedValue(true)
    const store = setupStore(WalletState.ACTIVE)

    store.dispatch(onRehydrationComplete())
    await flush()

    expect(walletStateOf(store)).toBe(WalletState.INACTIVE)
  })

  it('does not probe the keychain when no wallet is persisted (NONEXISTENT)', async () => {
    const store = setupStore(WalletState.NONEXISTENT)

    store.dispatch(onRehydrationComplete())
    await flush()

    expect(mockHasWalletData).not.toHaveBeenCalled()
    expect(walletStateOf(store)).toBe(WalletState.NONEXISTENT)
  })
})
