import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { noop } from 'lodash'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { AppStartListening } from 'store/middleware/listener'
import { showSnackbar, transactionSnackbar } from 'common/utils/toast'
import mockSessions from 'tests/fixtures/walletConnect/sessions'
import mockNetworks from 'tests/fixtures/networks.json'
import { WalletState } from 'store/app/types'
import * as appSlice from 'store/app/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { newSession, killSessions, onDisconnect } from '../slice'
import { addWCListeners } from './index'

// mocks
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: (callback: () => void) => callback()
}))

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn(),
  transactionSnackbar: {
    pending: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockWCPair = jest.fn()
jest.spyOn(WalletConnectService, 'pair').mockImplementation(mockWCPair)

const mockWCInit = jest.fn()
jest.spyOn(WalletConnectService, 'init').mockImplementation(mockWCInit)

const mockWCKillAllSessions = jest.fn()
jest
  .spyOn(WalletConnectService, 'killAllSessions')
  .mockImplementation(mockWCKillAllSessions)

const mockWCKillSessions = jest.fn()
jest
  .spyOn(WalletConnectService, 'killSessions')
  .mockImplementation(mockWCKillSessions)

const mockWCApproveRequest = jest.fn()
jest
  .spyOn(WalletConnectService, 'approveRequest')
  .mockImplementation(mockWCApproveRequest)

const mockWCApproveSession = jest.fn()
jest
  .spyOn(WalletConnectService, 'approveSession')
  .mockImplementation(mockWCApproveSession)

const mockWCRejectSession = jest.fn()
jest
  .spyOn(WalletConnectService, 'rejectSession')
  .mockImplementation(mockWCRejectSession)

jest.mock('store/settings/advanced/slice')
const mockSelectIsDeveloperMode = selectIsDeveloperMode as jest.Mock<
  ReturnType<typeof selectIsDeveloperMode>
>

const mockSelectNetwork = jest.fn()
jest.mock('store/network/slice', () => {
  const actual = jest.requireActual('store/network/slice')
  return {
    ...actual,
    selectNetwork: () => mockSelectNetwork
  }
})
mockSelectNetwork.mockImplementation(() => mockNetworks[43114])

const mockSelectWalletState = jest.fn()
jest
  .spyOn(appSlice, 'selectWalletState')
  .mockImplementation(mockSelectWalletState)

jest.mock('services/walletconnectv2/WalletConnectService')

jest.useFakeTimers()

// store utils
const listenerMiddlewareInstance = createListenerMiddleware({
  onError: jest.fn(noop)
})

jest.mock('services/analytics/AnalyticsService')
;(AnalyticsService.capture as jest.Mock).mockReturnValue(undefined)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dispatchSpyMiddleware = () => (next: any) => (action: any) => {
  return next(action)
}

const setupTestStore = () => {
  return configureStore({
    reducer: {},
    middleware: gDM =>
      gDM({
        serializableCheck: false
      })
        .prepend(listenerMiddlewareInstance.middleware)
        .prepend(dispatchSpyMiddleware)
  })
}

let store: ReturnType<typeof setupTestStore>

describe('walletConnect - listeners', () => {
  beforeEach(() => {
    mockSelectIsDeveloperMode.mockImplementation(() => false)

    // reset store and stop all active listeners
    listenerMiddlewareInstance.clearListeners()
    store = setupTestStore()

    // add listeners
    addWCListeners(
      listenerMiddlewareInstance.startListening as AppStartListening
    )
  })

  describe('on onLogIn', () => {
    it('should initialize wallet connect', () => {
      store.dispatch(appSlice.onLogIn())

      expect(mockWCInit).toHaveBeenCalledWith({
        onSessionProposal: expect.any(Function),
        onSessionRequest: expect.any(Function),
        onDisconnect: expect.any(Function)
      })
    })
  })

  describe('on onRehydrationComplete', () => {
    it('should not initialize wallet connect when wallet is not created yet', () => {
      mockSelectWalletState.mockImplementation(() => WalletState.NONEXISTENT)
      store.dispatch(appSlice.onRehydrationComplete())

      expect(mockWCInit).not.toHaveBeenCalled()
    })

    it('should initialize wallet connect when wallet is already created and active', () => {
      mockSelectWalletState.mockImplementationOnce(() => WalletState.ACTIVE)
      store.dispatch(appSlice.onRehydrationComplete())

      expect(mockWCInit).toHaveBeenCalledWith({
        onSessionProposal: expect.any(Function),
        onSessionRequest: expect.any(Function),
        onDisconnect: expect.any(Function)
      })
    })

    it('should initialize wallet connect when wallet is already created and inactive', () => {
      mockSelectWalletState.mockImplementationOnce(() => WalletState.INACTIVE)
      store.dispatch(appSlice.onRehydrationComplete())

      expect(mockWCInit).toHaveBeenCalledWith({
        onSessionProposal: expect.any(Function),
        onSessionRequest: expect.any(Function),
        onDisconnect: expect.any(Function)
      })
    })
  })

  describe('on newSession', () => {
    it('should start a new session', () => {
      const uri =
        'wc:e25230f0-df35-4517-adaf-ac4bbcbe884d@1?bridge=https%3A%2F%2F6.bridge.walletconnect.org&key=8b391e780d405773a7388fb683267f71bcec289c05e8b5ff575db6da42c93d6e'
      store.dispatch(newSession(uri))

      expect(mockWCPair).toHaveBeenCalledWith(uri)
    })

    it('should show error message when failed to start a new session', () => {
      const testError = new Error('test error')
      mockWCPair.mockImplementationOnce(() => {
        throw testError
      })

      const uri =
        'wc:e25230f0-df35-4517-adaf-ac4bbcbe884d@1?bridge=https%3A%2F%2F6.bridge.walletconnect.org&key=8b391e780d405773a7388fb683267f71bcec289c05e8b5ff575db6da42c93d6e'
      store.dispatch(newSession(uri))

      expect(mockWCPair).toHaveBeenCalledWith(uri)
      expect(transactionSnackbar.error).toHaveBeenCalledWith({
        message: 'Failed to pair with dApp',
        error: 'test error'
      })
    })
  })

  describe('on onLogOut', () => {
    it('should kill all sessions', () => {
      store.dispatch(appSlice.onLogOut())

      expect(mockWCKillAllSessions).toHaveBeenCalled()
    })
  })

  describe('on killSessions', () => {
    it('should kill specified sessions', () => {
      store.dispatch(killSessions(mockSessions))

      expect(mockWCKillSessions).toHaveBeenCalledWith(
        mockSessions.map(session => session.topic)
      )
    })
  })

  describe('on onDisconnect', () => {
    it('should show disconnected message', () => {
      const peerMeta = {
        name: 'dapp name',
        description: 'some description',
        url: 'some url',
        icons: ['url1', 'url2']
      }

      store.dispatch(onDisconnect(peerMeta))

      expect(showSnackbar).toHaveBeenCalledWith('dapp name was disconnected')
    })
  })
})
