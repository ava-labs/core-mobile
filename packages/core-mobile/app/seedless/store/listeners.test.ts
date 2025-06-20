import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { noop } from 'lodash'
import { AppStartListening } from 'store/types'
import { onAppUnlocked, onLogOut, onRehydrationComplete } from 'store/app'
import { WalletType } from 'services/wallet/types'
import SeedlessService from 'seedless/services/SeedlessService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { addSeedlessListeners } from './listeners'
import { onTokenExpired, reducerName } from './slice'

// mocks
jest.mock('services/wallet/WalletService', () => ({
  walletType: 'SEEDLESS'
}))

jest.mock('store/app', () => {
  const actual = jest.requireActual('store/app')
  return {
    ...actual,
    selectWalletType: jest.fn()
  }
})

jest.mock('store/wallet/slice', () => ({
  selectActiveWallet: jest.fn(),
  selectWalletById: jest.fn(),
  setActiveWallet: { type: 'wallet/setActiveWallet' }
}))

jest.mock('store/account/slice', () => ({
  selectAccountById: jest.fn(),
  setAccountTitle: { type: 'account/setAccountTitle' }
}))

jest.mock('seedless/services/SeedlessService', () => ({
  session: {
    refreshToken: jest.fn()
  },
  init: jest.fn(),
  setAccountName: jest.fn()
}))

jest.mock('services/socialSignIn/google/GoogleSigninService', () => ({
  signOut: jest.fn()
}))

jest.mock('services/wallet/WalletFactory', () => ({
  createWallet: jest.fn()
}))

jest.mock('seedless/services/storage/SeedlessPubKeysStorage', () => ({
  SeedlessPubKeysStorage: {
    clearCache: jest.fn()
  }
}))

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn()
  }
}))

// store utils
const listenerMiddlewareInstance = createListenerMiddleware({
  onError: jest.fn(noop)
})

const setupTestStore = () => {
  const store = configureStore({
    reducer: {
      [reducerName]: onTokenExpired
    },
    middleware: gDM => gDM().prepend(listenerMiddlewareInstance.middleware)
  })
  // @ts-ignore
  store.dispatch = jest.fn(store.dispatch)
  store.subscribe = jest.fn(store.subscribe)
  return store
}

let store: ReturnType<typeof setupTestStore>

describe('seedless - listeners', () => {
  beforeEach(() => {
    // reset store and stop all active listeners
    listenerMiddlewareInstance.clearListeners()
    store = setupTestStore()

    // add listeners
    addSeedlessListeners(
      listenerMiddlewareInstance.startListening as AppStartListening
    )
  })

  it('should call refresh token when active wallet is seedless', async () => {
    const { selectActiveWallet } = require('store/wallet/slice')
    selectActiveWallet.mockReturnValue({
      id: 'test-wallet',
      type: WalletType.SEEDLESS,
      name: 'Test Seedless Wallet'
    })

    store.dispatch(onAppUnlocked())
    expect(SeedlessService.session.refreshToken).toHaveBeenCalled()
  })

  it('should not call refresh token when active wallet is not seedless', async () => {
    const { selectActiveWallet } = require('store/wallet/slice')
    selectActiveWallet.mockReturnValue({
      id: 'test-wallet',
      type: WalletType.MNEMONIC,
      name: 'Test Mnemonic Wallet'
    })

    store.dispatch(onAppUnlocked())
    expect(SeedlessService.session.refreshToken).not.toHaveBeenCalled()
  })

  it('should not call refresh token when no active wallet exists', async () => {
    const { selectActiveWallet } = require('store/wallet/slice')
    selectActiveWallet.mockReturnValue(undefined)

    store.dispatch(onAppUnlocked())
    expect(SeedlessService.session.refreshToken).not.toHaveBeenCalled()
  })

  it('should init SeedlessService on onRehydrationComplete action', async () => {
    const { selectActiveWallet } = require('store/wallet/slice')
    selectActiveWallet.mockReturnValue({
      id: 'test-seedless-wallet',
      type: WalletType.SEEDLESS,
      name: 'Test Seedless Wallet'
    })

    store.dispatch(onRehydrationComplete())

    expect(SeedlessService.init).toHaveBeenCalledWith({
      onSessionExpired: expect.any(Function)
    })
  })

  it('should not init SeedlessService on onRehydrationComplete action when wallet is mnemonic', async () => {
    const { selectActiveWallet } = require('store/wallet/slice')
    selectActiveWallet.mockReturnValue({
      id: 'test-mnemonic-wallet',
      type: WalletType.MNEMONIC,
      name: 'Test Mnemonic Wallet'
    })

    store.dispatch(onRehydrationComplete())

    expect(SeedlessService.init).not.toHaveBeenCalled()
  })

  it('should have signed out', async () => {
    store.dispatch(onLogOut())
    expect(GoogleSigninService.signOut).toHaveBeenCalled()
  })
})
