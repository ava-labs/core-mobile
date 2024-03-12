import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { noop } from 'lodash'
import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked, onLogOut, onRehydrationComplete } from 'store/app'
import SeedlessService from 'seedless/services/SeedlessService'
import { ErrorEvent, GlobalEvents } from '@cubist-labs/cubesigner-sdk'
import * as Navigation from 'utils/Navigation'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { addSeedlessListeners } from './listeners'
import { onTokenExpired, reducerName } from './slice'

// mocks
jest.mock('services/wallet/WalletService', () => ({
  walletType: 'SEEDLESS'
}))
jest.mock('seedless/services/SeedlessService', () => ({
  sessionManager: {
    refreshToken: jest.fn()
  }
}))
jest.mock('services/socialSignIn/google/GoogleSigninService', () => ({
  signOut: jest.fn()
}))

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

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
    expect(SeedlessService.sessionManager.refreshToken).toHaveBeenCalled()
  })
  it('should have dispatched onTokenExpired action', async () => {
    store.dispatch(onRehydrationComplete())
    GlobalEvents.triggerErrorEvent({
      status: 403,
      isUserMfaError: () => false
    } as ErrorEvent)
    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'Root.RefreshToken',
      params: expect.anything()
    })
  })
  it('should have signed  out', async () => {
    store.dispatch(onLogOut())
    expect(GoogleSigninService.signOut).toHaveBeenCalled()
  })
})
