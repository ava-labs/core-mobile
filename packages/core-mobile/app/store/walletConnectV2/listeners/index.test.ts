import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { noop } from 'lodash'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { AppStartListening } from 'store/middleware/listener'
import * as Snackbar from 'components/Snackbar'
import mockSessions from 'tests/fixtures/walletConnect/sessions'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import { WalletState } from 'store/app/types'
import * as appSlice from 'store/app/slice'
import { ethErrors } from 'eth-rpc-errors'
import { typedData } from 'tests/fixtures/rpc/typedData'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { capture } from 'store/posthog'
import {
  walletConnectReducer,
  reducerName,
  newSession,
  killSessions,
  onDisconnect,
  onRequest,
  onRequestApproved,
  onRequestRejected
} from '../slice'
import { Request, RpcMethod } from '../types'
import handlerMap from '../handlers'
import { DEFERRED_RESULT } from '../handlers/types'
import { addWCListeners } from './index'

// mocks
const mockListenerApi = expect.any(Object)

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: (callback: () => void) => callback()
}))

const mockHandle = jest.fn()
const mockApprove = jest.fn()
const mockHandler = {
  handle: mockHandle,
  approve: mockApprove
}
const mockHandlerMapGet = jest.fn()
jest.spyOn(handlerMap, 'get').mockImplementation(mockHandlerMapGet)
mockHandlerMapGet.mockImplementation(() => mockHandler)

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

const mockWCRejectRequest = jest.fn()
jest
  .spyOn(WalletConnectService, 'rejectRequest')
  .mockImplementation(mockWCRejectRequest)

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
jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectNetwork: () => mockSelectNetwork
  }
})
mockSelectNetwork.mockImplementation(() => mockNetworks[43114])

const mockShowSimpleToast = jest.fn()
const mockShowDappToastError = jest.fn()
jest
  .spyOn(Snackbar, 'showDappToastError')
  .mockImplementation(mockShowDappToastError)
jest.spyOn(Snackbar, 'showSimpleToast').mockImplementation(mockShowSimpleToast)

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

const mockDispatch = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dispatchSpyMiddleware = () => (next: any) => (action: any) => {
  mockDispatch(action)
  return next(action)
}

const setupTestStore = () => {
  return configureStore({
    reducer: {
      [reducerName]: walletConnectReducer
    },
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
    mockDispatch.mockClear()
    mockSelectIsDeveloperMode.mockImplementation(() => false)
    mockApprove.mockImplementation(async () => {
      return {
        success: true,
        value: 'result to send back'
      }
    })

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
      expect(mockShowSimpleToast).toHaveBeenCalledWith(
        'Unable to pair with dapp'
      )
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

      expect(mockShowSimpleToast).toHaveBeenCalledWith(
        'dapp name was disconnected'
      )
    })
  })

  describe('on onRequest', () => {
    describe('for non session proposal requests', () => {
      const createRequest = (testMethod: RpcMethod, params: unknown) => {
        return {
          method: testMethod,
          data: {
            id: 1677366383831712,
            topic:
              '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
            params: {
              request: {
                method: testMethod,
                params
              },
              chainId: 'eip155:43114'
            }
          },
          session: mockSession
        }
      }

      const ethSignRequest = createRequest(
        'eth_signTypedData_v4' as RpcMethod.SIGN_TYPED_DATA_V4,
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', typedData]
      )

      it('should reject request when rpc method is not supported', () => {
        mockHandlerMapGet.mockImplementationOnce(() => undefined)

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          ethErrors.rpc.methodNotSupported().message,
          'Playground'
        )

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          ethErrors.rpc.methodNotSupported()
        )
      })

      it('should show error message when failed to reject request', () => {
        mockHandlerMapGet.mockImplementationOnce(() => undefined)

        const testError = new Error('test error')
        mockWCRejectRequest.mockImplementationOnce(() => {
          throw testError
        })

        const testRequest = ethSignRequest
        store.dispatch(onRequest(testRequest))

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          ethErrors.rpc.methodNotSupported().message,
          'Playground'
        )

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          ethErrors.rpc.methodNotSupported()
        )

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Unable to reject request',
          'Playground'
        )
      })

      it('should reject request when requested chain does not match developer mode', () => {
        mockSelectIsDeveloperMode.mockImplementation(() => true)

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Invalid environment. Please turn off developer mode and try again',
          'Playground'
        )

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          ethErrors.rpc.internal({
            message:
              'Invalid environment. Please turn off developer mode and try again'
          })
        )
      })

      it('should not reject request when requested chain does not match developer mode for a chain agnostic method', () => {
        mockSelectIsDeveloperMode.mockImplementation(() => true)

        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: [1, 2, 3]
          }
        })

        const testRequest = createRequest(
          'avalanche_getContacts' as RpcMethod.AVALANCHE_GET_CONTACTS,
          []
        )

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockShowDappToastError).not.toHaveBeenCalledWith(
          'Invalid environment. Please turn off developer mode and try again',
          'Playground'
        )

        expect(mockWCRejectRequest).not.toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          ethErrors.rpc.internal({
            message:
              'Invalid environment. Please turn off developer mode and try again'
          })
        )
      })

      it('should reject request when there is an error handling the request', () => {
        const testError = ethErrors.rpc.invalidParams('Invalid params')

        mockHandle.mockImplementation(async () => {
          return {
            success: false,
            error: testError
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Invalid params',
          'Playground'
        )

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          testError
        )
      })

      it('should approve request immediately when request is not a deferred one', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: [1, 2, 3]
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          [1, 2, 3]
        )
      })

      it('should show error message when failed to approve request', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: [1, 2, 3]
          }
        })

        const testError = new Error('test error')
        mockWCApproveRequest.mockImplementationOnce(() => {
          throw testError
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          [1, 2, 3]
        )

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Unable to approve request',
          'Playground'
        )
      })

      it('should approve request after user approves it', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: DEFERRED_RESULT
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1, b: 2 }
        store.dispatch(
          onRequestApproved({ request: testRequest, data: testApproveData })
        )

        jest.runOnlyPendingTimers()

        expect(mockApprove).toHaveBeenCalledWith(
          { request: testRequest, data: testApproveData },
          mockListenerApi
        )

        expect(mockWCApproveRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          'result to send back'
        )
      })

      it('should not approve request when user approves a different request', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: DEFERRED_RESULT
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))
        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1, b: 2 }
        store.dispatch(
          onRequestApproved({
            request: {
              ...testRequest,
              data: {
                ...testRequest.data,
                id: 2000
              }
            },
            data: testApproveData
          })
        )

        jest.runOnlyPendingTimers()

        expect(mockApprove).not.toHaveBeenCalled()

        expect(mockWCApproveRequest).not.toHaveBeenCalled()
      })

      it('should reject request when there is an error approving the request', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: DEFERRED_RESULT
          }
        })

        const testError = ethErrors.rpc.internal('Something went wrong')
        mockApprove.mockImplementation(async () => {
          return {
            success: false,
            error: testError
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1, b: 2 }
        store.dispatch(
          onRequestApproved({ request: testRequest, data: testApproveData })
        )

        jest.runOnlyPendingTimers()

        expect(mockApprove).toHaveBeenCalledWith(
          { request: testRequest, data: testApproveData },
          mockListenerApi
        )

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Something went wrong',
          'Playground'
        )

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          testError
        )
      })

      it('should reject request when user rejects the request', () => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: DEFERRED_RESULT
          }
        })

        const testRequest = ethSignRequest

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testError = ethErrors.provider.userRejectedRequest<string>()

        store.dispatch(
          onRequestRejected({
            request: testRequest,
            error: testError
          })
        )

        jest.runOnlyPendingTimers()

        expect(mockShowDappToastError).not.toHaveBeenCalled()

        expect(mockWCRejectRequest).toHaveBeenCalledWith(
          '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
          1677366383831712,
          testError
        )
      })
    })

    describe('for session proposal requests', () => {
      const testRequest = {
        method: 'session_request' as RpcMethod.SESSION_REQUEST,
        data: {
          id: 1678303290160528,
          params: {
            id: 1678303290160528,
            pairingTopic:
              '73af283605154f5a8643286042e6671df51a180ecebc88d6715a7b86cfae5fb3',
            topic:
              '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
            expiry: 1678303596,
            requiredNamespaces: {
              eip155: {
                methods: [
                  'eth_sendTransaction',
                  'eth_signTypedData_v3',
                  'eth_signTypedData_v4',
                  'eth_signTypedData_v1',
                  'eth_signTypedData',
                  'eth_sign',
                  'personal_sign',
                  'wallet_addEthereumChain',
                  'wallet_switchEthereumChain',
                  'avalanche_getContacts',
                  'avalanche_createContact',
                  'avalanche_removeContact',
                  'avalanche_updateContact',
                  'avalanche_selectAccount',
                  'avalanche_getAccounts',
                  'avalanche_bridgeAsset'
                ],
                chains: ['eip155:43114', 'eip155:1'],
                events: ['chainChanged', 'accountsChanged'],
                rpcMap: {
                  '1': 'https://rpc.ankr.com/eth',
                  '43114': 'https://api.avax.network/ext/bc/C/rpc'
                }
              }
            },
            optionalNamespaces: {},
            relays: [{ protocol: 'irn' }],
            proposer: {
              publicKey:
                '95cb51ec29dd245d2270d1b7725fdc2f2e3f2180dd68c84910fa172324889a67',
              metadata: {
                description: '',
                url: 'http://127.0.0.1:5173',
                icons: [''],
                name: 'Playground'
              }
            }
          }
        }
      } as unknown as Request

      beforeEach(() => {
        mockHandle.mockImplementation(async () => {
          return {
            success: true,
            value: DEFERRED_RESULT
          }
        })

        mockApprove.mockImplementation(async () => {
          return {
            success: true,
            value: { a: 1, b: 2 }
          }
        })

        mockWCApproveSession.mockImplementation(async () => mockSession)
      })

      it('should approve session request after user approves it', () => {
        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1 }

        store.dispatch(
          onRequestApproved({ request: testRequest, data: testApproveData })
        )

        jest.runOnlyPendingTimers()

        expect(mockApprove).toHaveBeenCalledWith(
          { request: testRequest, data: testApproveData },
          mockListenerApi
        )

        expect(mockWCApproveSession).toHaveBeenCalledWith({
          id: 1678303290160528,
          relayProtocol: 'irn',
          namespaces: { a: 1, b: 2 }
        })

        expect(mockShowSimpleToast).toHaveBeenCalledWith(
          'Connected to Playground'
        )

        expect(mockDispatch).toHaveBeenCalledWith(
          capture({
            event: 'WalletConnectSessionApprovedV2',
            properties: {
              namespaces: JSON.stringify(mockSession.namespaces),
              requiredNamespaces: JSON.stringify(
                mockSession.requiredNamespaces
              ),
              optionalNamespaces: JSON.stringify(
                mockSession.optionalNamespaces
              ),
              dappUrl: 'http://127.0.0.1:5173'
            }
          })
        )
      })

      it('should show error message when failed to approve session', () => {
        const testError = new Error('test error')
        mockWCApproveSession.mockImplementation(() => {
          throw testError
        })

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1 }

        store.dispatch(
          onRequestApproved({ request: testRequest, data: testApproveData })
        )

        jest.runOnlyPendingTimers()

        expect(mockApprove).toHaveBeenCalledWith(
          { request: testRequest, data: testApproveData },
          mockListenerApi
        )

        expect(mockWCApproveSession).toHaveBeenCalledWith({
          id: 1678303290160528,
          relayProtocol: 'irn',
          namespaces: { a: 1, b: 2 }
        })

        expect(mockShowSimpleToast).not.toHaveBeenCalledWith(
          'Connected to Playground'
        )

        expect(mockDispatch).not.toHaveBeenCalledWith(
          capture({
            event: 'WalletConnectSessionApprovedV2',
            properties: {
              requiredNamespaces: JSON.stringify(
                mockSession.requiredNamespaces
              ),
              dappUrl: 'http://127.0.0.1:5173'
            }
          })
        )

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Unable to approve session proposal',
          'Playground'
        )
      })

      it('should reject session request after user rejects it', () => {
        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        const testError = ethErrors.provider.userRejectedRequest<string>()

        store.dispatch(
          onRequestRejected({ request: testRequest, error: testError })
        )

        jest.runOnlyPendingTimers()

        expect(mockShowDappToastError).not.toHaveBeenCalled()

        expect(mockWCRejectSession).toHaveBeenCalledWith(1678303290160528)
      })

      it('should show error message when failed to reject session', () => {
        const testError1 = new Error('test error')
        mockWCRejectSession.mockImplementation(() => {
          throw testError1
        })

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        const testError2 = ethErrors.provider.userRejectedRequest<string>()

        store.dispatch(
          onRequestRejected({ request: testRequest, error: testError2 })
        )

        jest.runOnlyPendingTimers()

        expect(mockShowDappToastError).not.toHaveBeenCalledWith(
          testError2.message,
          'Playground'
        )

        expect(mockWCRejectSession).toHaveBeenCalledWith(1678303290160528)

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          'Unable to reject session proposal',
          'Playground'
        )
      })

      it('should reject session request when there is an error approving the proposal', () => {
        const testError = new Error('test error')
        mockApprove.mockImplementation(() => ({
          success: false,
          error: testError
        }))

        store.dispatch(onRequest(testRequest))

        jest.runOnlyPendingTimers()

        expect(mockHandle).toHaveBeenCalledWith(testRequest, mockListenerApi)

        expect(mockWCApproveRequest).not.toHaveBeenCalled()

        const testApproveData = { a: 1 }

        store.dispatch(
          onRequestApproved({ request: testRequest, data: testApproveData })
        )

        jest.runOnlyPendingTimers()

        expect(mockShowDappToastError).toHaveBeenCalledWith(
          testError.message,
          'Playground'
        )

        expect(mockWCRejectSession).toHaveBeenCalledWith(1678303290160528)
      })
    })
  })
})
