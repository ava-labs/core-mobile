import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { setTabChainId } from 'store/browser/slices/tabs'
import type { Networks } from 'store/network/types'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import type { Account } from 'store/account'
import {
  EIP1193_USER_REJECTED_CODE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from './errors'
import { createInjectedProviderRouter } from './router'
import { BrowserNetwork, RouterDeps } from './types'

jest.mock('react-native-nitro-fetch', () => ({ fetch: jest.fn() }))

const mockNitroFetch = nitroFetch as jest.MockedFunction<typeof nitroFetch>

jest.mock('store/browser/slices/tabs', () => ({
  setTabChainId: jest.fn((payload: { tabId: string; chainId: number }) => ({
    type: 'browser/tabs/setTabChainId',
    payload
  }))
}))

jest.mock('utils/caip2ChainIds', () => ({
  getEvmCaip2ChainId: (chainId: number) => `eip155:${chainId}`
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    trace: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

type MockDeps = {
  deps: RouterDeps
  sendResponse: jest.Mock
  emitEvent: jest.Mock
  requestSigning: jest.Mock
  dispatch: jest.Mock
  trackPendingOrigin: jest.Mock
  setBrowserNetworkSpy: jest.Mock
  currentNetwork: { value: BrowserNetwork }
  hasPermission: jest.Mock
  grantPermission: jest.Mock
  revokePermission: jest.Mock
  requestConnectApproval: jest.Mock
  activeAccount: { value: Account | undefined }
}

const MOCK_ADDR = '0xTestAddress1234567890'
const MOCK_ACCOUNT = { addressC: MOCK_ADDR } as Account

function makeDeps(overrides?: {
  browserNetwork?: BrowserNetwork
  allNetworks?: Networks
  nativeOrigin?: string | undefined
  tabId?: string
  activeAccount?: Account | undefined
  hasPermission?: boolean
}): MockDeps {
  const currentNetwork = {
    value: overrides?.browserNetwork ?? {
      chainId: 43114,
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
    }
  }
  const allNetworks =
    overrides?.allNetworks ??
    ({
      43114: {
        chainId: 43114,
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
      },
      1: {
        chainId: 1,
        rpcUrl: 'https://eth.llamarpc.com'
      }
    } as unknown as Networks)

  const sendResponse = jest.fn()
  const emitEvent = jest.fn()
  const requestSigning = jest.fn()
  const dispatch = jest.fn()
  const trackPendingOrigin = jest.fn()
  const setBrowserNetworkSpy = jest.fn((net: BrowserNetwork) => {
    currentNetwork.value = net
  })
  const hasPermission = jest.fn(() => overrides?.hasPermission ?? false)
  const grantPermission = jest.fn()
  const revokePermission = jest.fn()
  const requestConnectApproval = jest.fn()
  const activeAccount = {
    value:
      overrides && 'activeAccount' in overrides
        ? overrides.activeAccount
        : MOCK_ACCOUNT
  }

  const deps: RouterDeps = {
    getBrowserNetwork: () => currentNetwork.value,
    setBrowserNetwork: setBrowserNetworkSpy,
    getAllNetworks: () => allNetworks,
    tabId: overrides?.tabId ?? 'tab-1',
    dispatch,
    requestSigning,
    sendResponse,
    emitEvent,
    getNativeOrigin: () =>
      overrides && 'nativeOrigin' in overrides
        ? overrides.nativeOrigin
        : 'https://example.com',
    trackPendingOrigin,
    getPeerMeta: () => ({
      name: 'example',
      description: '',
      url: 'https://example.com',
      icons: []
    }),
    getActiveAccount: () => activeAccount.value,
    hasPermission,
    grantPermission,
    revokePermission,
    requestConnectApproval
  }

  return {
    deps,
    sendResponse,
    emitEvent,
    requestSigning,
    dispatch,
    trackPendingOrigin,
    hasPermission,
    grantPermission,
    revokePermission,
    requestConnectApproval,
    activeAccount,
    setBrowserNetworkSpy,
    currentNetwork
  }
}

function send(
  router: ReturnType<typeof createInjectedProviderRouter>,
  method: string,
  params: unknown[] = []
): void {
  router.handleProviderMessage(
    JSON.stringify({ id: 1, request: { method, params } })
  )
}

// Like `send` but with an explicit request id — needed by tests that track
// multiple concurrent in-flight requests (the router keys its abort map by id).
function sendWithId(
  router: ReturnType<typeof createInjectedProviderRouter>,
  id: number,
  request: { method: string; params?: unknown[] }
): void {
  router.handleProviderMessage(
    JSON.stringify({
      id,
      request: { method: request.method, params: request.params ?? [] }
    })
  )
}

describe('createInjectedProviderRouter', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('dispatch', () => {
    it('rejects unknown methods with methodNotFound', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'totally_fake_method')

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('tracks native origin for allowed methods', () => {
      const { deps, trackPendingOrigin } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')

      expect(trackPendingOrigin).toHaveBeenCalledWith(1, 'https://example.com')
    })

    it('rejects any method with unauthorized when native origin is unavailable', () => {
      const { deps, sendResponse } = makeDeps({ nativeOrigin: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          code: 4100,
          message: expect.stringContaining('Origin unavailable')
        }),
        undefined
      )
    })

    it('rejects non-signing read-only methods when native origin is unavailable', () => {
      const { deps, sendResponse } = makeDeps({ nativeOrigin: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('rejects with invalidRequest when shim-reported origin differs from native origin', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(
        JSON.stringify({
          id: 1,
          origin: 'https://evil.example',
          request: { method: 'eth_blockNumber', params: [] }
        })
      )

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          code: -32600,
          message: expect.stringContaining('Origin mismatch')
        }),
        undefined
      )
    })
  })

  describe('payload parsing', () => {
    it('ignores invalid JSON', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage('not-json')

      expect(sendResponse).not.toHaveBeenCalled()
    })

    it('responds invalidRequest for malformed request with numeric id', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(JSON.stringify({ id: 7, request: null }))

      expect(sendResponse).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ code: -32600 }),
        undefined
      )
    })

    it('responds invalidRequest when payload exceeds size limit', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      const big = 'x'.repeat(2_000_000)
      router.handleProviderMessage(
        JSON.stringify({ id: 9, request: { method: 'eth_call' }, big })
      )

      expect(sendResponse).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ code: -32600 }),
        undefined
      )
    })
  })

  describe('wallet_switchEthereumChain', () => {
    it('returns invalidParams when chainId missing', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_switchEthereumChain', [{}])

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32602 }),
        undefined
      )
    })

    it('returns 4902 for unknown chain (triggers addEthereumChain flow)', () => {
      const { deps, sendResponse } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_switchEthereumChain', [{ chainId: '0x2a' }]) // 42

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        { code: 4902, message: expect.stringContaining('Chain 42') },
        undefined
      )
    })

    it('no-ops when already on requested chain', () => {
      const { deps, sendResponse, dispatch, setBrowserNetworkSpy } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_switchEthereumChain', [{ chainId: '0xa86a' }])

      expect(dispatch).not.toHaveBeenCalled()
      expect(setBrowserNetworkSpy).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(1, null, null)
    })

    it('updates browser network and dispatches setTabChainId on known chain switch', () => {
      const { deps, sendResponse, dispatch, setBrowserNetworkSpy } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_switchEthereumChain', [{ chainId: '0x1' }]) // 1

      expect(dispatch).toHaveBeenCalledWith(
        setTabChainId({ tabId: 'tab-1', chainId: 1 })
      )
      expect(setBrowserNetworkSpy).toHaveBeenCalledWith({
        chainId: 1,
        rpcUrl: 'https://eth.llamarpc.com'
      })
      expect(sendResponse).toHaveBeenCalledWith(1, null, null)
    })
  })

  describe('wallet_addEthereumChain', () => {
    it('on approval, updates browser network, dispatches setTabChainId, emits chainChanged', async () => {
      const {
        deps,
        sendResponse,
        dispatch,
        setBrowserNetworkSpy,
        emitEvent,
        requestSigning
      } = makeDeps()
      requestSigning.mockResolvedValueOnce('')
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(
        JSON.stringify({
          id: 1,
          request: {
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x1', rpcUrls: ['https://eth.llamarpc.com'] }]
          }
        })
      )
      await new Promise(r => setImmediate(r))

      expect(setBrowserNetworkSpy).toHaveBeenCalledWith({
        chainId: 1,
        rpcUrl: 'https://eth.llamarpc.com'
      })
      expect(dispatch).toHaveBeenCalledWith(
        setTabChainId({ tabId: 'tab-1', chainId: 1 })
      )
      expect(emitEvent).toHaveBeenCalledWith('chainChanged', '0x1')
      expect(sendResponse).toHaveBeenCalledWith(1, null, null)
    })

    it('on rejection, propagates the error', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      const rejection = {
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      }
      requestSigning.mockRejectedValueOnce(rejection)
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(
        JSON.stringify({
          id: 1,
          request: {
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x1', rpcUrls: ['https://eth.llamarpc.com'] }]
          }
        })
      )
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, rejection, undefined)
    })
  })

  describe('wallet_revokePermissions', () => {
    it('revokes the grant for the origin, emits accountsChanged([]), responds null, does NOT emit disconnect', () => {
      const { deps, sendResponse, emitEvent, revokePermission } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_revokePermissions')

      expect(revokePermission).toHaveBeenCalledWith({
        domain: 'https://example.com'
      })
      expect(emitEvent).toHaveBeenCalledWith('accountsChanged', [])
      expect(emitEvent).not.toHaveBeenCalledWith(
        'disconnect',
        expect.anything()
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, null)
    })

    it('rejects wallet_revokePermissions outright when origin is unknown', () => {
      // Post-origin-hardening: no method proceeds without a verified native
      // origin, including revoke. Returning 4100 makes the ambiguity explicit
      // rather than silently emitting accountsChanged for an origin we can't
      // identify.
      const { deps, sendResponse, emitEvent, revokePermission } = makeDeps({
        nativeOrigin: undefined
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_revokePermissions')

      expect(revokePermission).not.toHaveBeenCalled()
      expect(emitEvent).not.toHaveBeenCalledWith(
        'accountsChanged',
        expect.anything()
      )
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })
  })

  describe('eth_requestAccounts', () => {
    it('returns the active address without prompting when already granted', async () => {
      const { deps, sendResponse, requestConnectApproval, grantPermission } =
        makeDeps({ hasPermission: true })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).not.toHaveBeenCalled()
      expect(grantPermission).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(1, null, [MOCK_ADDR])
    })

    it('opens approval when not granted, grants, and returns selected accounts', async () => {
      const {
        deps,
        sendResponse,
        requestConnectApproval,
        grantPermission,
        emitEvent
      } = makeDeps()
      requestConnectApproval.mockResolvedValueOnce([MOCK_ACCOUNT])
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://example.com' })
      )
      expect(grantPermission).toHaveBeenCalledWith({
        domain: 'https://example.com',
        address: MOCK_ADDR,
        vmType: NetworkVMType.EVM
      })
      expect(sendResponse).toHaveBeenCalledWith(1, null, [MOCK_ADDR])
      expect(emitEvent).toHaveBeenCalledWith('accountsChanged', [MOCK_ADDR])
    })

    it('propagates user rejection from the approval', async () => {
      const { deps, sendResponse, requestConnectApproval } = makeDeps()
      const rejection = {
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      }
      requestConnectApproval.mockRejectedValueOnce(rejection)
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, rejection, undefined)
    })

    it('rejects with unauthorized (4100) when there is no active account', async () => {
      const { deps, sendResponse } = makeDeps({ activeAccount: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('rejects with unauthorized (4100) when origin is missing', async () => {
      const { deps, sendResponse } = makeDeps({ nativeOrigin: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })
  })

  describe('wallet_requestPermissions', () => {
    it('returns EIP-2255 permission object when already granted', async () => {
      const { deps, sendResponse } = makeDeps({ hasPermission: true })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_requestPermissions')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        null,
        expect.arrayContaining([
          expect.objectContaining({
            parentCapability: 'eth_accounts',
            caveats: expect.arrayContaining([
              expect.objectContaining({
                type: 'restrictReturnedAccounts',
                value: [MOCK_ADDR]
              })
            ])
          })
        ])
      )
    })

    it('opens approval and returns EIP-2255 permission object on approval', async () => {
      const { deps, sendResponse, requestConnectApproval, grantPermission } =
        makeDeps()
      requestConnectApproval.mockResolvedValueOnce([MOCK_ACCOUNT])
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_requestPermissions')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).toHaveBeenCalledTimes(1)
      expect(grantPermission).toHaveBeenCalledTimes(1)
      const [[, , result]] = sendResponse.mock.calls
      expect(result).toEqual([
        expect.objectContaining({ parentCapability: 'eth_accounts' })
      ])
    })
  })

  describe('wallet_getPermissions', () => {
    it('returns an EIP-2255 permission list when the active account is granted', () => {
      const { deps, sendResponse } = makeDeps({ hasPermission: true })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_getPermissions')

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        null,
        expect.arrayContaining([
          expect.objectContaining({ parentCapability: 'eth_accounts' })
        ])
      )
    })

    it('returns an empty array when the active account is not granted', () => {
      const { deps, sendResponse } = makeDeps({ hasPermission: false })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_getPermissions')

      expect(sendResponse).toHaveBeenCalledWith(1, null, [])
    })

    it('rejects wallet_getPermissions with unauthorized when origin is missing', () => {
      // The prior behavior of returning [] for unknown origin would let a
      // page with no verified origin (e.g. about:blank, pre-navigation race)
      // make the request and get a clean empty response. Post-hardening every
      // method requires a native origin; this call is rejected upstream of
      // the handler.
      const { deps, sendResponse } = makeDeps({ nativeOrigin: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_getPermissions')

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })
  })

  describe('wallet_watchAsset', () => {
    it('on EIP-1193 user rejection, responds with (null, false) per EIP-747', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      requestSigning.mockRejectedValueOnce({ code: EIP1193_USER_REJECTED_CODE })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_watchAsset', [
        { type: 'ERC20', options: { address: '0xAA' } }
      ])
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, null, false)
    })

    it('on non-user-rejection error, propagates as real error', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      const internalErr = {
        code: JSON_RPC_INTERNAL_ERROR_CODE,
        message: 'internal'
      }
      requestSigning.mockRejectedValueOnce(internalErr)
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_watchAsset', [
        { type: 'ERC20', options: { address: '0xAA' } }
      ])
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, internalErr, undefined)
    })

    it('accepts object-form params and normalizes to array', async () => {
      const { deps, requestSigning } = makeDeps()
      requestSigning.mockResolvedValueOnce(true)
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(
        JSON.stringify({
          id: 1,
          request: {
            method: 'wallet_watchAsset',
            params: { type: 'ERC20', options: { address: '0xAA' } }
          }
        })
      )
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          params: [{ type: 'ERC20', options: { address: '0xAA' } }]
        })
      )
    })
  })

  describe('signing methods', () => {
    it('calls requestSigning with caip2 chain and peer meta, resolves with result', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      requestSigning.mockResolvedValueOnce('0xSig')
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'personal_sign',
          params: ['0xMsg', '0xAddr'],
          chainId: 'eip155:43114',
          peerMeta: expect.objectContaining({ name: 'example' }),
          signal: expect.any(AbortSignal)
        })
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xSig')
    })

    it('propagates rejection from requestSigning', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      const err = {
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      }
      requestSigning.mockRejectedValueOnce(err)
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, err, undefined)
    })
  })

  describe('proxyToRpc', () => {
    afterEach(() => {
      mockNitroFetch.mockReset()
    })

    it('returns internal error when rpcUrl is empty', async () => {
      const { deps, sendResponse } = makeDeps({
        browserNetwork: { chainId: 1, rpcUrl: '' }
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: JSON_RPC_INTERNAL_ERROR_CODE }),
        undefined
      )
    })

    it('proxies result on successful RPC fetch', async () => {
      const { deps, sendResponse } = makeDeps()
      mockNitroFetch.mockResolvedValue({
        json: async () => ({ result: '0xabc' })
      } as unknown as Response)
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xabc')
    })

    it('surfaces RPC error field', async () => {
      const { deps, sendResponse } = makeDeps()
      const rpcErr = { code: -32000, message: 'node error' }
      mockNitroFetch.mockResolvedValue({
        json: async () => ({ error: rpcErr })
      } as unknown as Response)
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, rpcErr, undefined)
    })

    it('returns internal error on fetch failure', async () => {
      const { deps, sendResponse } = makeDeps()
      mockNitroFetch.mockRejectedValue(new Error('network down'))
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: JSON_RPC_INTERNAL_ERROR_CODE }),
        undefined
      )
    })
  })

  describe('cancelByOrigin', () => {
    it('aborts in-flight signing requests whose origin does not match the new origin', async () => {
      const { deps, requestSigning } = makeDeps()
      // Never resolves — simulates a signing request sitting on an approval
      // screen while the user navigates away.
      let capturedSignal: AbortSignal | undefined
      requestSigning.mockImplementationOnce(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      const router = createInjectedProviderRouter(deps)

      sendWithId(router, 42, {
        method: 'personal_sign',
        params: ['0xMsg', '0xAddr']
      })
      await new Promise(r => setImmediate(r))

      expect(capturedSignal?.aborted).toBe(false)

      router.cancelByOrigin('https://other.example')

      expect(capturedSignal?.aborted).toBe(true)
    })

    it('does not abort requests whose origin matches the new origin', async () => {
      const { deps, requestSigning } = makeDeps()
      let capturedSignal: AbortSignal | undefined
      requestSigning.mockImplementationOnce(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      const router = createInjectedProviderRouter(deps)

      sendWithId(router, 42, {
        method: 'personal_sign',
        params: ['0xMsg', '0xAddr']
      })
      await new Promise(r => setImmediate(r))

      // Same origin as makeDeps default — should NOT abort
      router.cancelByOrigin('https://example.com')

      expect(capturedSignal?.aborted).toBe(false)
    })

    it('is a no-op when there are no in-flight requests', () => {
      const { deps } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      // Does not throw, does not emit anything
      expect(() =>
        router.cancelByOrigin('https://anywhere.example')
      ).not.toThrow()
    })

    it('cleans up in-flight tracking after abort', async () => {
      const { deps, requestSigning } = makeDeps()
      const signals: AbortSignal[] = []
      requestSigning.mockImplementation(args => {
        if (args.signal) signals.push(args.signal)
        return new Promise(() => undefined)
      })
      const router = createInjectedProviderRouter(deps)

      sendWithId(router, 1, { method: 'personal_sign', params: ['a', 'b'] })
      await new Promise(r => setImmediate(r))

      router.cancelByOrigin('https://other.example')
      expect(signals[0]?.aborted).toBe(true)

      // A second cancel round should not re-abort the same controller.
      // (If it did, reading .aborted still returns true, but the important
      // thing is the entry was removed from the map.) Fire another request
      // and confirm it gets its own independent signal.
      sendWithId(router, 2, { method: 'personal_sign', params: ['c', 'd'] })
      await new Promise(r => setImmediate(r))
      expect(signals[1]).toBeDefined()
      expect(signals[1]?.aborted).toBe(false)
    })
  })
})
