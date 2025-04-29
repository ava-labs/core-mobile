import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { noop } from 'lodash'
import { AppStartListening } from 'store/middleware/listener'
import {
  onAppUnlocked,
  onLogOut,
  selectWalletType,
  onRehydrationComplete
} from 'store/app'
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

jest.mock('seedless/services/SeedlessService', () => ({
  session: {
    refreshToken: jest.fn()
  },
  init: jest.fn()
}))

jest.mock('services/socialSignIn/google/GoogleSigninService', () => ({
  signOut: jest.fn()
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

  it('should have called refresh token', async () => {
    store.dispatch(onAppUnlocked())
    expect(SeedlessService.session.refreshToken).toHaveBeenCalled()
  })

  it('should init SeedlessService on onRehydrationComplete action', async () => {
    const mockSelectWalletType =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectWalletType as jest.MockedFunction<any>
    mockSelectWalletType.mockImplementationOnce(() => {
      return WalletType.SEEDLESS
    })
    store.dispatch(onRehydrationComplete())

    expect(SeedlessService.init).toHaveBeenCalledWith({
      onSessionExpired: expect.any(Function)
    })
  })
  it('should not init SeedlessService on onRehydrationComplete action when wallet is mnemonic', async () => {
    const mockSelectWalletType =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectWalletType as jest.MockedFunction<any>
    mockSelectWalletType.mockImplementationOnce(() => {
      return WalletType.MNEMONIC
    })
    store.dispatch(onRehydrationComplete())

    expect(SeedlessService.init).not.toHaveBeenCalledWith({
      onSessionExpired: expect.any(Function)
    })
  })
  it('should have signed out', async () => {
    store.dispatch(onLogOut())
    expect(GoogleSigninService.signOut).toHaveBeenCalled()
  })
})
