import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { setTabChainId } from 'store/browser/slices/tabs'
import type { Networks } from 'store/network/types'
import type { Account } from 'store/account'
import {
  EIP1193_USER_REJECTED_CODE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from './errors'
import { createInjectedProviderRouter } from './router'
import { BrowserNetwork, RouterDeps } from './types'

jest.mock('store/browser/slices/tabs', () => ({
  setTabChainId: jest.fn((payload: { tabId: string; chainId: number }) => ({
    type: 'browser/tabs/setTabChainId',
    payload
  }))
}))

jest.mock('utils/caip2ChainIds', () => ({
  getEvmCaip2ChainId: (chainId: number) => `eip155:${chainId}`,
  // Recognizable stand-in so the avalanche signing tests can assert the router
  // resolves scope from chainAlias + dev-mode (the real SDK caip2 values are
  // covered by app/utils/caip2ChainIds.test.ts).
  getAvalancheChainAliasCaip2: (chainAlias: string, isTestnet: boolean) =>
    `avax:${chainAlias}${isTestnet ? '-testnet' : ''}`
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
  requestReadOnly: jest.Mock
  dispatch: jest.Mock
  trackPendingOrigin: jest.Mock
  setBrowserNetworkSpy: jest.Mock
  currentNetwork: { value: BrowserNetwork }
  getGrantedAddresses: jest.Mock
  grantPermission: jest.Mock
  revokePermission: jest.Mock
  requestConnectApproval: jest.Mock
  setActiveAccount: jest.Mock
  activeAccount: { value: Account | undefined }
}

// A real 40-hex address — the signing gate validates `from`/signer args are
// well-formed EVM addresses, so signer-grant tests need valid ones.
const MOCK_ADDR = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const OTHER_GRANTED_ADDR = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const UNGRANTED_ADDR = '0xcccccccccccccccccccccccccccccccccccccccc'
const MOCK_ACCOUNT = { addressC: MOCK_ADDR } as Account

function makeDeps(overrides?: {
  browserNetwork?: BrowserNetwork
  allNetworks?: Networks
  nativeOrigin?: string | undefined
  tabId?: string
  activeAccount?: Account | undefined
  grantedAddresses?: string[]
  isDeveloperMode?: boolean
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
  const requestReadOnly = jest.fn().mockResolvedValue('0xreadonly')
  const dispatch = jest.fn()
  const trackPendingOrigin = jest.fn()
  const setBrowserNetworkSpy = jest.fn((net: BrowserNetwork) => {
    currentNetwork.value = net
  })
  // Back getGrantedAddresses with a live set that grantPermission mutates, so a
  // grant during an approval flow is reflected when the handler re-reads the
  // granted addresses to reconcile them against the active account.
  const grantedSet = new Set<string>(overrides?.grantedAddresses ?? [])
  const getGrantedAddresses = jest.fn(() => [...grantedSet])
  const grantPermission = jest.fn(({ address }: { address: string }) =>
    grantedSet.add(address)
  )
  const revokePermission = jest.fn()
  const requestConnectApproval = jest.fn()
  const setActiveAccount = jest.fn(async () => undefined)
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
    requestReadOnly,
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
    getIsDeveloperMode: () => overrides?.isDeveloperMode ?? false,
    getGrantedAddresses,
    grantPermission,
    revokePermission,
    requestConnectApproval,
    setActiveAccount
  }

  return {
    deps,
    sendResponse,
    emitEvent,
    requestSigning,
    requestReadOnly,
    dispatch,
    trackPendingOrigin,
    getGrantedAddresses,
    grantPermission,
    revokePermission,
    requestConnectApproval,
    setActiveAccount,
    activeAccount,
    setBrowserNetworkSpy,
    currentNetwork
  }
}

function send(
  router: ReturnType<typeof createInjectedProviderRouter>,
  method: string,
  // `unknown` (not unknown[]): most methods take array params, but avalanche
  // signing takes an object with a top-level chainAlias.
  params: unknown = []
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

  describe('first-party avalanche_* gate (CP-13672)', () => {
    it('rejects avalanche_* from a third-party origin with methodNotFound, without dispatching to the VM module', async () => {
      // Security gate: avalanche_* (X/P account management + signing) is
      // first-party-only. A third-party origin must be rejected up front — and
      // with methodNotFound, not a permission error, so the response is
      // indistinguishable from the method simply not existing (a third-party
      // page can't even probe for the capability). It must never reach the
      // account/signing handlers behind the gate.
      const { deps, sendResponse, requestReadOnly } = makeDeps({
        nativeOrigin: 'https://pangolin.exchange'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestReadOnly).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('lets avalanche_* from a first-party origin through the gate (routed to the in-app bridge)', async () => {
      // core.app (and the rest of the first-party allowlist) is trusted; the
      // gate must not block it. The account methods route through the in-app
      // request bridge (requestSigning) to their dedicated handlers — the point
      // here is only that the gate passes it through rather than rejecting it.
      const { deps, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce([])
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'avalanche_getAccounts' })
      )
    })

    it('classifies avalanche_* case-insensitively so a mixed-case probe cannot evade the gate', async () => {
      // The gate's method classifier must not be defeatable by casing. A
      // third-party page sending `Avalanche_getAccounts` must still be gated
      // (rejected, never dispatched) — closing any future mismatch between this
      // classifier and a downstream handler that might match case-insensitively.
      const { deps, sendResponse, requestReadOnly } = makeDeps({
        nativeOrigin: 'https://pangolin.exchange'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'Avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestReadOnly).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('does not gate EVM methods by origin (eth_call works from any origin)', async () => {
      // The gate is scoped to avalanche_* only — it must not bleed into the EVM
      // surface, which keeps its own per-origin grant model for third parties.
      const { deps, requestReadOnly } = makeDeps({
        nativeOrigin: 'https://pangolin.exchange'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_call', [{}])
      await new Promise(r => setImmediate(r))

      expect(requestReadOnly).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_call' })
      )
    })
  })

  describe('avalanche account methods (CP-13672)', () => {
    it('routes avalanche_getAccounts through the in-app bridge and returns its result', async () => {
      // First-party only (gated above). getAccounts returns ALL accounts + xpub
      // detail (D1) — safe precisely because the origin is first-party. It runs
      // through the in-app bridge to the dedicated handler (no approval, no
      // per-address grant check), NOT the read-only VM path.
      const accounts = [{ index: 0, addressC: MOCK_ADDR, active: true }]
      const { deps, sendResponse, requestSigning, requestReadOnly } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce(accounts)
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'avalanche_getAccounts', params: [] })
      )
      expect(requestReadOnly).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(1, null, accounts)
    })

    it('routes avalanche_selectAccount through the bridge with the account-id param', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce([])
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_selectAccount', ['account-id-123'])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'avalanche_selectAccount',
          params: ['account-id-123']
        })
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, [])
    })

    it('routes avalanche_getAccountPubKey through the bridge', async () => {
      const pubKey = { evm: '0xevmpub', xp: 'xppub' }
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce(pubKey)
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccountPubKey')
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'avalanche_getAccountPubKey' })
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, pubKey)
    })

    it('does not run the EVM signer-grant check for account methods (no per-address grant required)', async () => {
      // Account methods are authorized by the first-party origin alone (D5), not
      // by a per-(address,vmType) grant. A first-party origin with NO EVM grants
      // must still be able to call them.
      const { deps, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app',
        grantedAddresses: []
      })
      requestSigning.mockResolvedValueOnce([])
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'avalanche_getAccounts' })
      )
    })

    it('rejects avalanche_selectAccount from a third-party origin without switching the account', async () => {
      // The silent active-account switch must never be reachable by a
      // third-party page: the gate rejects it before the bridge is ever called,
      // so no account switch can be triggered.
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://pangolin.exchange'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_selectAccount', ['account-id-123'])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('propagates a bridge error for an avalanche account method', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      const err = { code: -32000, message: 'handler failed' }
      requestSigning.mockRejectedValueOnce(err)
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_getAccounts')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, err, undefined)
    })
  })

  describe('avalanche signing methods (CP-13672)', () => {
    // avalanche signing requests carry an OBJECT params with a top-level
    // chainAlias — sent raw (the dApp doesn't wrap it in an array). `send`
    // forwards the params verbatim.
    it('routes avalanche_sendTransaction with the CAIP-2 derived from chainAlias and the RAW object params', async () => {
      const params = {
        chainAlias: 'P',
        transactionHex: '0xdeadbeef',
        externalIndices: [],
        internalIndices: []
      }
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce('0xtxhash')
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_sendTransaction', params)
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'avalanche_sendTransaction',
          // RAW object params — chainAlias must survive (NOT array-coerced to []).
          params,
          chainId: 'avax:P',
          signal: expect.any(AbortSignal)
        })
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xtxhash')
    })

    it('derives the X-chain CAIP-2 for avalanche_signTransaction with chainAlias X', async () => {
      const { deps, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce('0xsigned')
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_signTransaction', {
        chainAlias: 'X',
        transactionHex: '0x01'
      })
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'avalanche_signTransaction',
          chainId: 'avax:X'
        })
      )
    })

    it('routes avalanche_signMessage (tuple params [message, accountIndex], no chainAlias) with a default avalanche CAIP-2', async () => {
      // Unlike send/signTransaction, avalanche_signMessage params are an ARRAY
      // [message, accountIndex] with NO chainAlias. It must NOT be rejected for a
      // missing chainAlias; the signature is account-keyed (network-independent),
      // so it routes with a default avalanche scope (X) that only selects the
      // avalanche module + the approval-screen network label.
      const params = ['hello core', 0]
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      requestSigning.mockResolvedValueOnce('0xsig')
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_signMessage', params)
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'avalanche_signMessage',
          params, // raw tuple preserved, not rejected
          chainId: 'avax:X'
        })
      )
      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xsig')
    })

    it('honors developer mode for avalanche_signMessage default scope', async () => {
      const { deps, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app',
        isDeveloperMode: true
      })
      requestSigning.mockResolvedValueOnce('0xsig')
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_signMessage', ['hello', 0])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: 'avax:X-testnet' })
      )
    })

    it('uses the testnet CAIP-2 when the wallet is in developer mode', async () => {
      const { deps, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app',
        isDeveloperMode: true
      })
      requestSigning.mockResolvedValueOnce('0xtxhash')
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_sendTransaction', {
        chainAlias: 'P',
        transactionHex: '0x01'
      })
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: 'avax:P-testnet' })
      )
    })

    it('rejects with invalidParams (without signing) when chainAlias is missing or invalid', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      const router = createInjectedProviderRouter(deps)

      // missing chainAlias
      send(router, 'avalanche_sendTransaction', {
        transactionHex: '0x01'
      })
      // invalid chainAlias
      sendWithId(router, 2, {
        method: 'avalanche_sendTransaction',
        params: [{ chainAlias: 'ETH', transactionHex: '0x01' }]
      })
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32602 }),
        undefined
      )
      expect(sendResponse).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ code: -32602 }),
        undefined
      )
    })

    it('rejects avalanche_sendTransaction from a third-party origin (gate) without signing', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://pangolin.exchange'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_sendTransaction', {
        chainAlias: 'P',
        transactionHex: '0x01'
      })
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('propagates a signing error/rejection back to the dApp', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        nativeOrigin: 'https://core.app'
      })
      const err = { code: 4001, message: 'User rejected' }
      requestSigning.mockRejectedValueOnce(err)
      const router = createInjectedProviderRouter(deps)

      send(router, 'avalanche_sendTransaction', {
        chainAlias: 'P',
        transactionHex: '0x01'
      })
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, err, undefined)
    })
  })

  describe('dispatch', () => {
    it('routes unknown/non-signing methods to requestReadOnly and propagates its error', async () => {
      // Method classification is no longer a static allowlist: anything not
      // injected-specific or signing is handed to requestReadOnly, which
      // validates against the module manifest and rejects unsupported methods
      // with methodNotFound (-32601). The router just propagates that.
      const { deps, sendResponse, requestReadOnly } = makeDeps()
      requestReadOnly.mockRejectedValueOnce({
        code: -32601,
        message: 'Unsupported method: totally_fake_method'
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'totally_fake_method')
      await new Promise(r => setImmediate(r))

      expect(requestReadOnly).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'totally_fake_method' })
      )
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: -32601 }),
        undefined
      )
    })

    it('routes prototype-chain method names to read-only, never signing', async () => {
      // `method` is dApp-controlled; signing detection must be an own-property
      // check so inherited Object keys can't hit the signing branch and call
      // requestSigning with a non-RPC value.
      const { deps, requestSigning, requestReadOnly } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      for (const m of [
        'toString',
        'constructor',
        '__proto__',
        'hasOwnProperty'
      ]) {
        send(router, m)
      }
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(requestReadOnly).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'toString' })
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

    it('does not treat a non-string origin as a mismatch', () => {
      // `origin` is not type-checked by validateProviderRequest. A truthy
      // non-string value must not trip the mismatch branch — it's ignored and
      // the request proceeds gated on the trusted nativeOrigin.
      const { deps, sendResponse, trackPendingOrigin } = makeDeps()
      const router = createInjectedProviderRouter(deps)

      router.handleProviderMessage(
        JSON.stringify({
          id: 1,
          origin: { not: 'a string' },
          request: { method: 'eth_blockNumber', params: [] }
        })
      )

      expect(sendResponse).not.toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: expect.stringContaining('Origin mismatch')
        }),
        undefined
      )
      expect(trackPendingOrigin).toHaveBeenCalledWith(1, 'https://example.com')
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
        makeDeps({ grantedAddresses: [MOCK_ADDR] })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).not.toHaveBeenCalled()
      expect(grantPermission).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(1, null, [MOCK_ADDR])
    })

    it('returns ALL granted addresses (active first) without prompting, not just the active one', async () => {
      // Multi-account: switching the wallet's active account must not force a
      // re-prompt — every previously-granted address is returned, active first.
      const OTHER = '0xOtherGrantedAddr'
      const { deps, sendResponse, requestConnectApproval } = makeDeps({
        grantedAddresses: [OTHER, MOCK_ADDR]
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(1, null, [MOCK_ADDR, OTHER])
    })

    it('prompts (does NOT short-circuit) when the origin has grants but the active account is not among them', async () => {
      // Reconciliation: the active-only signer can't authorize an ungranted
      // active account, so eth_requestAccounts must prompt rather than report a
      // connection to other granted addresses.
      const { deps, sendResponse, requestConnectApproval, grantPermission } =
        makeDeps({ grantedAddresses: ['0xOtherGrantedAddr'] })
      requestConnectApproval.mockResolvedValueOnce([MOCK_ACCOUNT])
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).toHaveBeenCalled()
      expect(grantPermission).toHaveBeenCalledWith({
        domain: 'https://example.com',
        address: MOCK_ADDR,
        vmType: NetworkVMType.EVM
      })
      // After granting the (active) selection, the advertised set is reconciled
      // against the active account: the full granted set, active first.
      expect(sendResponse).toHaveBeenCalledWith(1, null, [
        MOCK_ADDR,
        '0xOtherGrantedAddr'
      ])
    })

    it('switches the wallet active account to the selection (instead of 4100) when the approved account is not the active one', async () => {
      // The injected signer is active-only. If the user connects an account that
      // isn't the wallet's active one, switch the active account to the primary
      // selection so the connection reconciles to an account Core will actually
      // sign with — rather than returning 4100, which dApps read as "not
      // connected" and answer with an eth_requestAccounts reconnect loop. (CP-14385)
      const {
        deps,
        sendResponse,
        requestConnectApproval,
        grantPermission,
        setActiveAccount,
        activeAccount,
        emitEvent
      } = makeDeps()
      // active = MOCK_ACCOUNT (MOCK_ADDR); user picks a different account.
      const SELECTED = { id: 'acc-2', addressC: OTHER_GRANTED_ADDR } as Account
      requestConnectApproval.mockResolvedValueOnce([SELECTED])
      // setActiveAccount flips the wallet's active account, as the real thunk does.
      setActiveAccount.mockImplementation(async () => {
        activeAccount.value = SELECTED
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(grantPermission).toHaveBeenCalledWith({
        domain: 'https://example.com',
        address: OTHER_GRANTED_ADDR,
        vmType: NetworkVMType.EVM
      })
      expect(setActiveAccount).toHaveBeenCalledWith('acc-2')
      // Reconciles to the now-active, granted account — no 4100, no loop.
      expect(sendResponse).toHaveBeenCalledWith(1, null, [OTHER_GRANTED_ADDR])
      expect(emitEvent).toHaveBeenCalledWith('accountsChanged', [
        OTHER_GRANTED_ADDR
      ])
    })

    it('does NOT switch the active account when it is already among the selection', async () => {
      // Least surprise: if the wallet's active account is one of the connected
      // accounts, leave it active — only switch when it would otherwise reconcile
      // to nothing. (CP-14385)
      const { deps, sendResponse, requestConnectApproval, setActiveAccount } =
        makeDeps()
      requestConnectApproval.mockResolvedValueOnce([
        { id: 'acc-1', addressC: MOCK_ADDR } as Account,
        { id: 'acc-2', addressC: OTHER_GRANTED_ADDR } as Account
      ])
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_requestAccounts')
      await new Promise(r => setImmediate(r))

      expect(setActiveAccount).not.toHaveBeenCalled()
      // active (MOCK_ADDR) is granted → reconciled active-first.
      expect(sendResponse).toHaveBeenCalledWith(1, null, [
        MOCK_ADDR,
        OTHER_GRANTED_ADDR
      ])
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
        expect.objectContaining({ url: 'https://example.com' }),
        expect.any(Number)
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
      const { deps, sendResponse } = makeDeps({ grantedAddresses: [MOCK_ADDR] })
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
      // Threads the JSON-RPC id so the connect-approval registry can key by
      // `${tabId}:${requestId}:${nonce}` (the nonce guarantees uniqueness —
      // requestIds are reused after a page reload). (CP-14385)
      expect(requestConnectApproval).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number)
      )
      expect(grantPermission).toHaveBeenCalledTimes(1)
      const [[, , result]] = sendResponse.mock.calls
      expect(result).toEqual([
        expect.objectContaining({ parentCapability: 'eth_accounts' })
      ])
    })

    it('prompts when the origin has grants but the active account is not among them', async () => {
      const { deps, requestConnectApproval } = makeDeps({
        grantedAddresses: ['0xOtherGrantedAddr']
      })
      requestConnectApproval.mockResolvedValueOnce([MOCK_ACCOUNT])
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_requestPermissions')
      await new Promise(r => setImmediate(r))

      expect(requestConnectApproval).toHaveBeenCalledTimes(1)
    })

    it('switches the wallet active account to the selection (instead of 4100) when the approved account is not the active one', async () => {
      // Same active-switch reconciliation as eth_requestAccounts: connect the
      // selected account by making it active, rather than 4100 + reconnect loop.
      // (CP-14385)
      const {
        deps,
        sendResponse,
        requestConnectApproval,
        setActiveAccount,
        activeAccount
      } = makeDeps()
      const SELECTED = { id: 'acc-2', addressC: OTHER_GRANTED_ADDR } as Account
      requestConnectApproval.mockResolvedValueOnce([SELECTED])
      setActiveAccount.mockImplementation(async () => {
        activeAccount.value = SELECTED
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_requestPermissions')
      await new Promise(r => setImmediate(r))

      expect(setActiveAccount).toHaveBeenCalledWith('acc-2')
      const [[, error, result]] = sendResponse.mock.calls
      expect(error).toBeNull()
      expect(result).toEqual([
        expect.objectContaining({
          parentCapability: 'eth_accounts',
          caveats: expect.arrayContaining([
            expect.objectContaining({
              type: 'restrictReturnedAccounts',
              value: [OTHER_GRANTED_ADDR]
            })
          ])
        })
      ])
    })
  })

  describe('wallet_getPermissions', () => {
    it('returns an EIP-2255 permission list when the active account is granted', () => {
      const { deps, sendResponse } = makeDeps({ grantedAddresses: [MOCK_ADDR] })
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

    it('returns an empty array when there are no grants for the origin', () => {
      const { deps, sendResponse } = makeDeps({ grantedAddresses: [] })
      const router = createInjectedProviderRouter(deps)

      send(router, 'wallet_getPermissions')

      expect(sendResponse).toHaveBeenCalledWith(1, null, [])
    })

    it('returns [] when the origin has grants but the active account is not among them', () => {
      // Reconciliation: a dApp polling wallet_getPermissions must see a
      // disconnected state when the active-only signer is an ungranted account,
      // not the other granted addresses.
      const { deps, sendResponse } = makeDeps({
        grantedAddresses: ['0xOtherGrantedAddr']
      })
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
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
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

    it('rejects (4100) without prompting when the active account is not granted to the origin', async () => {
      // The injected signer is active-only; if the dApp was never told about the
      // active account, a signing request must reject up front, never prompt —
      // otherwise the dApp would learn of the account by it being signed for.
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: ['0xOtherGrantedAddr']
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xMsg', '0xAddr'])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('rejects eth_sendTransaction (4100) when `from` is an account not granted to the origin', async () => {
      // An's repro: connected/active is the granted account, but the dApp sets
      // `from` to a different, ungranted address. The signer resolves the
      // account from `from`, so this must reject up front — no approval prompt —
      // rather than sign with an account the dApp was never granted.
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_sendTransaction', [
        { from: UNGRANTED_ADDR, to: '0xdead', value: '0x0' }
      ])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('allows eth_sendTransaction when `from` is the active account (hex case-insensitive)', async () => {
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      requestSigning.mockResolvedValueOnce('0xTxHash')
      const router = createInjectedProviderRouter(deps)

      // Same address, uppercased hex (checksum-style) — must still match.
      send(router, 'eth_sendTransaction', [
        { from: '0x' + MOCK_ADDR.slice(2).toUpperCase(), to: '0xdead' }
      ])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalled()
    })

    it('allows eth_sendTransaction from a granted account that is not the active one', async () => {
      // Multi-account: the dApp may transact from any account it was granted,
      // not only the active one. The signer resolves that account from `from`.
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR, OTHER_GRANTED_ADDR] // active is MOCK_ADDR
      })
      requestSigning.mockResolvedValueOnce('0xTxHash')
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_sendTransaction', [
        { from: OTHER_GRANTED_ADDR, to: '0xdead', value: '0x0' }
      ])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalled()
    })

    it('rejects eth_sendTransactionBatch (4100) when the active account is not granted, even if every tx `from` is granted', async () => {
      // The batch handler signs with the active account index, not the per-tx
      // `from` — so the gate must check the active account. Otherwise a dApp
      // could set `from` to a granted address while the ungranted active account
      // does the signing (the bypass Copilot flagged).
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [OTHER_GRANTED_ADDR] // active (MOCK_ADDR) NOT granted
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_sendTransactionBatch', [
        [{ from: OTHER_GRANTED_ADDR, to: '0x0' }]
      ])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('allows eth_sendTransactionBatch when the active account is granted, regardless of tx `from`', async () => {
      // `from` is irrelevant for batch (the handler signs with the active
      // account); only the active account's grant matters.
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR] // active is granted
      })
      requestSigning.mockResolvedValueOnce('0xBatch')
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_sendTransactionBatch', [
        [{ from: UNGRANTED_ADDR, to: '0x0' }]
      ])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalled()
    })

    it('rejects personal_sign (4100) when the signer address arg is not granted', async () => {
      // personal_sign(message, address) — params[1] is the signer. A Permit-
      // style signature from an ungranted account is the same fund-loss class
      // as a tx, so reject up front.
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xdeadbeef', UNGRANTED_ADDR])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('allows personal_sign when the signer address arg is granted', async () => {
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      requestSigning.mockResolvedValueOnce('0xSig')
      const router = createInjectedProviderRouter(deps)

      send(router, 'personal_sign', ['0xdeadbeef', MOCK_ADDR])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalled()
    })

    it('rejects eth_signTypedData_v4 (4100) when the signer address arg is not granted', async () => {
      // signTypedData_v4(address, typedData) — params[0] is the signer.
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_signTypedData_v4', [UNGRANTED_ADDR, '{"types":{}}'])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).not.toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 4100 }),
        undefined
      )
    })

    it('propagates rejection from requestSigning', async () => {
      const { deps, sendResponse, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
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

    it('routes eth_sendTransactionBatch through requestSigning, not the read-only path', async () => {
      const { deps, requestSigning, requestReadOnly } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      requestSigning.mockResolvedValueOnce('0xBatch')
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_sendTransactionBatch', [[{ to: '0x0' }]])
      await new Promise(r => setImmediate(r))

      expect(requestSigning).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_sendTransactionBatch' })
      )
      expect(requestReadOnly).not.toHaveBeenCalled()
    })
  })

  describe('read-only dispatch', () => {
    it('delegates read-only methods to requestReadOnly with the per-tab chainId and resolves the result', async () => {
      const { deps, sendResponse, requestReadOnly } = makeDeps({
        browserNetwork: { chainId: 1, rpcUrl: 'https://eth.llamarpc.com' }
      })
      requestReadOnly.mockResolvedValueOnce('0xabc')
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_call', [{ to: '0x0' }])
      await new Promise(r => setImmediate(r))

      expect(requestReadOnly).toHaveBeenCalledWith({
        id: 1,
        method: 'eth_call',
        params: [{ to: '0x0' }],
        chainId: 1
      })
      expect(sendResponse).toHaveBeenCalledWith(1, null, '0xabc')
    })

    it('propagates an RpcError-shaped rejection from requestReadOnly', async () => {
      const { deps, sendResponse, requestReadOnly } = makeDeps()
      const rpcErr = { code: -32000, message: 'node error' }
      requestReadOnly.mockRejectedValueOnce(rpcErr)
      const router = createInjectedProviderRouter(deps)

      send(router, 'eth_blockNumber')
      await new Promise(r => setImmediate(r))

      expect(sendResponse).toHaveBeenCalledWith(1, rpcErr, undefined)
    })
  })

  describe('cancelByOrigin', () => {
    it('aborts in-flight signing requests whose origin does not match the new origin', async () => {
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
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
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
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

    it('aborts a signing request that registers AFTER a cross-origin nav (pre-registration race)', async () => {
      // The edge-triggered cancelByOrigin runs (page navigated away) BEFORE this
      // request registers its in-flight controller — so the abort loop finds
      // nothing and never re-fires. Without live-origin tracking the request
      // would park a modal that can never be cancelled and hang. (CP-14422)
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
      let capturedSignal: AbortSignal | undefined
      requestSigning.mockImplementationOnce(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      const router = createInjectedProviderRouter(deps)

      // Cross-origin nav lands first (no in-flight request yet to abort).
      router.cancelByOrigin('https://other.example')

      // Then the signing request for the now-stale origin registers.
      sendWithId(router, 42, {
        method: 'personal_sign',
        params: ['0xMsg', '0xAddr']
      })
      await new Promise(r => setImmediate(r))

      // Its signal must be born aborted, so the signing pipeline short-circuits
      // to userRejectedRequest instead of opening an uncancellable modal.
      expect(capturedSignal?.aborted).toBe(true)
    })

    it('does not abort a request that registers for the new (post-nav) origin', async () => {
      // Guard against over-aborting: after navigating to other.example, a request
      // legitimately originating from other.example must NOT be aborted.
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR],
        nativeOrigin: 'https://other.example'
      })
      let capturedSignal: AbortSignal | undefined
      requestSigning.mockImplementationOnce(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      const router = createInjectedProviderRouter(deps)

      router.cancelByOrigin('https://other.example')

      sendWithId(router, 42, {
        method: 'personal_sign',
        params: ['0xMsg', '0xAddr']
      })
      await new Promise(r => setImmediate(r))

      expect(capturedSignal?.aborted).toBe(false)
    })

    it('cleans up in-flight tracking after abort', async () => {
      const { deps, requestSigning } = makeDeps({
        grantedAddresses: [MOCK_ADDR]
      })
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

      // The entry was removed from the map (re-cancel won't double-abort it).
      // Now the page returns to its origin (getNativeOrigin), so a fresh request
      // from that origin gets its own independent, non-aborted signal — the
      // live-origin guard only aborts requests whose origin is now stale.
      router.cancelByOrigin('https://example.com')
      sendWithId(router, 2, { method: 'personal_sign', params: ['c', 'd'] })
      await new Promise(r => setImmediate(r))
      expect(signals[1]).toBeDefined()
      expect(signals[1]?.aborted).toBe(false)
    })
  })
})
