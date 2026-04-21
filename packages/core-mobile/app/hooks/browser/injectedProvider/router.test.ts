import { setTabChainId } from 'store/browser/slices/tabs'
import type { Networks } from 'store/network/types'
import { createInjectedProviderRouter } from './router'
import { BrowserNetwork, RouterDeps } from './types'

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
}

function makeDeps(overrides?: {
  browserNetwork?: BrowserNetwork
  allNetworks?: Networks
  nativeOrigin?: string | undefined
  tabId?: string
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
    })
  }

  return {
    deps,
    sendResponse,
    emitEvent,
    requestSigning,
    dispatch,
    trackPendingOrigin,
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

    it('rejects signing methods when native origin is unavailable', () => {
      const { deps, sendResponse } = makeDeps({ nativeOrigin: undefined })
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          code: -32603,
          message: expect.stringContaining('Origin unavailable')
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
      const rejection = { code: 4001, message: 'User rejected' }
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
    it('emits accountsChanged([]) and responds null — does NOT emit disconnect', () => {
      const { deps, sendResponse, emitEvent } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_revokePermissions')

      expect(emitEvent).toHaveBeenCalledWith('accountsChanged', [])
      expect(emitEvent).not.toHaveBeenCalledWith(
        'disconnect',
        expect.anything()
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, null)
    })
  })

  describe('wallet_watchAsset', () => {
    it('on 4001 rejection, responds with (null, false) per EIP-747', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      requestSigning.mockRejectedValueOnce({ code: 4001 })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_watchAsset', [
        { type: 'ERC20', options: { address: '0xAA' } }
      ])
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, null, false)
    })

    it('on non-4001 error, propagates as real error', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      const internalErr = { code: -32603, message: 'internal' }
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

      expect(requestSigning).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: ['0xMsg', '0xAddr'],
        chainId: 'eip155:43114',
        peerMeta: expect.objectContaining({ name: 'example' })
      })
      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xSig')
    })

    it('propagates rejection from requestSigning', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps()
      const err = { code: 4001, message: 'User rejected' }
      requestSigning.mockRejectedValueOnce(err)
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, err, undefined)
    })
  })

  describe('proxyToRpc', () => {
    const originalFetch = global.fetch

    afterEach(() => {
      global.fetch = originalFetch
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
        expect.objectContaining({ code: -32603 }),
        undefined
      )
    })

    it('proxies result on successful RPC fetch', async () => {
      const { deps, sendResponse } = makeDeps()
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ result: '0xabc' })
      }) as unknown as typeof fetch
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xabc')
    })

    it('surfaces RPC error field', async () => {
      const { deps, sendResponse } = makeDeps()
      const rpcErr = { code: -32000, message: 'node error' }
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ error: rpcErr })
      }) as unknown as typeof fetch
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, rpcErr, undefined)
    })

    it('returns internal error on fetch failure', async () => {
      const { deps, sendResponse } = makeDeps()
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('network down')) as unknown as typeof fetch
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32603 }),
        undefined
      )
    })
  })
})
