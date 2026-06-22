import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import {
  getEvmCaip2ChainId,
  getAvalancheChainAliasCaip2
} from 'utils/caip2ChainIds'
import { setTabChainId } from 'store/browser/slices/tabs'
import { isUserRejectedRpcError } from './errors'
import { resolveActiveConnectedAccounts } from './resolveGrantedAccounts'
import { isFirstPartyOrigin } from './firstPartyDomains'
import { MAX_MESSAGE_SIZE, ProviderRequest, RouterDeps } from './types'

// avalanche_* methods (X/P account management + signing) are first-party-only.
// A prefix classifies them: it conservatively covers every current and future
// avalanche_* method, so a new one can't silently bypass the gate by not being
// added to a hand-maintained list. Matched case-insensitively so a mixed-case
// probe (`Avalanche_*`) can't evade the gate and reach a downstream handler that
// might compare differently. CP-13672.
const isAvalancheMethod = (method: string): boolean =>
  method.toLowerCase().startsWith('avalanche_')

// The first-party avalanche account methods (X/P). They resolve to dedicated RPC
// handlers (handlerMap, keyed by these exact method strings — RpcMethod values
// in store/rpc/types) that read wallet state and require no approval and no
// per-address grant. Matched case-sensitively to mirror the exact handlerMap
// keys: a mixed-case variant has no handler and is correctly methodNotFound (and
// is already blocked from third parties by the case-insensitive gate). Signing
// methods (avalanche_sendTransaction/…) are intentionally NOT here — they need
// per-request CAIP-2 scope and route separately. CP-13672.
const AVALANCHE_ACCOUNT_METHODS = new Set<string>([
  'avalanche_getAccounts',
  'avalanche_selectAccount',
  'avalanche_getAccountPubKey'
])

const isAvalancheAccountMethod = (method: string): boolean =>
  AVALANCHE_ACCOUNT_METHODS.has(method)

// The first-party avalanche signing methods (X/P/C). Unlike the account methods,
// these route to the Avalanche VM module (ModuleManager.loadModule by CAIP-2)
// and go through the approval screen. They carry an OBJECT params with a
// top-level `chainAlias` that selects the chain (X/P/C); the request's CAIP-2
// scope is derived from it per-request (D3), NOT from the EVM browser network.
// Exact case-sensitive match (same reasoning as the account set). CP-13672.
const AVALANCHE_SIGNING_METHODS = new Set<string>([
  'avalanche_sendTransaction',
  'avalanche_signTransaction',
  'avalanche_signMessage'
])

const isAvalancheSigningMethod = (method: string): boolean =>
  AVALANCHE_SIGNING_METHODS.has(method)

// The Avalanche Primary Network chain aliases a signing request may target.
const isAvalancheChainAlias = (value: unknown): value is 'X' | 'P' | 'C' =>
  value === 'X' || value === 'P' || value === 'C'

// Injected-specific methods (connect / EIP-2255 permissions / chain management)
// are handled directly in `dispatchMethod`. Signing methods route through
// `requestSigning`. Everything else is treated as read-only and dispatched to
// the VM module, which validates it against its manifest — so the read-only
// allowlist is no longer hand-maintained here (CP-14384).
//
// This list must cover every EVM (eth_*/personal_*) method in the vm-module
// RpcMethod enum: a signing method missing here silently falls through to the
// read-only branch. A drift guard in router.test.ts cross-checks it against the
// enum so it can't quietly fall out of sync.
export const SIGNING_METHODS: Record<string, RpcMethod> = {
  [RpcMethod.ETH_SEND_TRANSACTION]: RpcMethod.ETH_SEND_TRANSACTION,
  [RpcMethod.ETH_SEND_TRANSACTION_BATCH]: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
  [RpcMethod.PERSONAL_SIGN]: RpcMethod.PERSONAL_SIGN,
  [RpcMethod.ETH_SIGN]: RpcMethod.ETH_SIGN,
  [RpcMethod.SIGN_TYPED_DATA]: RpcMethod.SIGN_TYPED_DATA,
  [RpcMethod.SIGN_TYPED_DATA_V1]: RpcMethod.SIGN_TYPED_DATA_V1,
  [RpcMethod.SIGN_TYPED_DATA_V3]: RpcMethod.SIGN_TYPED_DATA_V3,
  [RpcMethod.SIGN_TYPED_DATA_V4]: RpcMethod.SIGN_TYPED_DATA_V4
}

// `method` comes straight from the dApp, so an own-property check is required:
// `method in SIGNING_METHODS` / `SIGNING_METHODS[method]` walk the prototype
// chain, so names like `toString`, `constructor`, or `__proto__` would otherwise
// hit the signing branch and call requestSigning with a non-RPC value.
const signingMethodFor = (method: string): RpcMethod | undefined =>
  Object.prototype.hasOwnProperty.call(SIGNING_METHODS, method)
    ? SIGNING_METHODS[method]
    : undefined

const isEvmAddress = (value: unknown): value is string =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)

// The account address(es) a signing request will be signed with, when the dApp
// names one in the request. The approval screen resolves the signing account
// from the address the request carries (selectAccountByAddress) — the tx
// `from`, or the signer-address arg of a message-sign method — so the caller
// must validate each against the origin's grants and never sign with an account
// the dApp wasn't granted (An's repro: connected as account 2, then
// eth_sendTransaction with from = account 1).
//
// Arg positions follow the EIP/MetaMask conventions the VM module parses:
//   personal_sign(message, address)            → params[1]
//   eth_sign(address, message)                 → params[0]
//   eth_signTypedData / _v1 (typedData, addr)  → params[1]
//   eth_signTypedData_v3 / _v4 (addr, data)    → params[0]
//
// NOTE eth_sendTransactionBatch is intentionally absent: its handler signs with
// the wallet's *active account index* and ignores the per-tx `from`, so gating
// on `from` would be both wrong and bypassable (a granted `from` with an
// ungranted active account). It falls through to [] here so the caller gates on
// the active account instead.
//
// Only well-formed addresses are returned: a malformed/unexpected param is
// skipped (the caller falls back to the active account) so a parse mismatch can
// never reject a valid request.
const requestedSignerAddresses = (
  method: RpcMethod,
  params: unknown[]
): string[] => {
  switch (method) {
    case RpcMethod.ETH_SEND_TRANSACTION: {
      const from = (params[0] as { from?: unknown } | null | undefined)?.from
      return isEvmAddress(from) ? [from] : []
    }
    case RpcMethod.PERSONAL_SIGN:
    case RpcMethod.SIGN_TYPED_DATA:
    case RpcMethod.SIGN_TYPED_DATA_V1:
      return isEvmAddress(params[1]) ? [params[1]] : []
    case RpcMethod.ETH_SIGN:
    case RpcMethod.SIGN_TYPED_DATA_V3:
    case RpcMethod.SIGN_TYPED_DATA_V4:
      return isEvmAddress(params[0]) ? [params[0]] : []
    default:
      return []
  }
}

// EIP-2255 — only eth_accounts is supported; no other restricted methods today.
function buildAccountsPermission(addresses: string[]): unknown[] {
  if (addresses.length === 0) return []
  return [
    {
      parentCapability: 'eth_accounts',
      date: Date.now(),
      caveats: [
        {
          type: 'restrictReturnedAccounts',
          value: addresses
        }
      ]
    }
  ]
}

function validateProviderRequest(data: unknown): data is ProviderRequest {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (typeof obj.id !== 'number') return false
  if (typeof obj.request !== 'object' || obj.request === null) return false
  const req = obj.request as Record<string, unknown>
  return typeof req.method === 'string'
}

function parseProviderPayload(
  payload: string,
  respondWithError: (id: number, error: unknown) => void
): ProviderRequest | undefined {
  // The cap is in bytes, but `payload.length` counts UTF-16 code units. A
  // UTF-8 encoding is at most 3 bytes per code unit, so only when the cheap
  // unit count could possibly exceed the cap do we pay for an exact byte
  // measurement — keeping the hot path (frequent eth_blockNumber/eth_call
  // polling) allocation-free for normal-sized messages.
  if (
    payload.length * 3 > MAX_MESSAGE_SIZE &&
    new TextEncoder().encode(payload).length > MAX_MESSAGE_SIZE
  ) {
    Logger.warn(
      `[InjectedProvider] Message exceeds ${MAX_MESSAGE_SIZE} byte limit`
    )
    try {
      const { id } = JSON.parse(payload) as { id?: unknown }
      if (typeof id === 'number') {
        respondWithError(
          id,
          rpcErrors.invalidRequest('Message exceeds size limit')
        )
      }
    } catch {
      /* oversized and unparseable */
    }
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    Logger.error('[InjectedProvider] Invalid JSON payload')
    return undefined
  }

  if (!validateProviderRequest(parsed)) {
    Logger.error('[InjectedProvider] Malformed provider_request')
    if (typeof parsed === 'object' && parsed !== null) {
      const maybeId = (parsed as Record<string, unknown>).id
      if (typeof maybeId === 'number') {
        respondWithError(maybeId, rpcErrors.invalidRequest('Malformed request'))
      }
    }
    return undefined
  }

  return parsed
}

export type InjectedProviderRouter = {
  handleProviderMessage: (payload: string) => void
  /**
   * Aborts every in-flight abortable request whose origin does not match
   * `currentOrigin`. Call when the WebView navigates to a new origin so stale
   * signing / add-chain / watch-asset flows tied to the prior page cannot
   * complete or broadcast.
   */
  cancelByOrigin: (currentOrigin: string | undefined) => void
}

type InFlightRequest = {
  origin: string
  controller: AbortController
}

export function createInjectedProviderRouter(
  deps: RouterDeps
): InjectedProviderRouter {
  const {
    getBrowserNetwork,
    setBrowserNetwork,
    getAllNetworks,
    tabId,
    dispatch,
    requestSigning,
    requestReadOnly,
    sendResponse,
    emitEvent,
    getNativeOrigin,
    trackPendingOrigin,
    getPeerMeta,
    getActiveAccount,
    getIsDeveloperMode,
    getGrantedAddresses,
    grantPermission,
    revokePermission,
    requestConnectApproval
  } = deps

  const inFlightRequests = new Map<number, InFlightRequest>()

  // The origin the WebView has most recently navigated TO (set by cancelByOrigin
  // on every cross-origin nav). `cancelByOrigin` is edge-triggered and only
  // aborts requests ALREADY in `inFlightRequests`, so a signing request that
  // registers AFTER that edge would be missed — it'd park a modal that can never
  // be cancelled and hang. Recording the live origin lets `registerInFlight`
  // catch that late registration and abort it on arrival. (CP-14422)
  let liveOrigin: string | undefined

  const registerInFlight = (id: number, origin: string): AbortController => {
    const controller = new AbortController()
    // The page already navigated away from this request's origin before it
    // registered (the cross-origin abort edge has passed and won't re-fire) —
    // born aborted so the signing pipeline short-circuits to userRejectedRequest
    // instead of opening an uncancellable modal. (CP-14422)
    if (liveOrigin !== undefined && origin !== liveOrigin) {
      controller.abort()
    }
    inFlightRequests.set(id, { origin, controller })
    return controller
  }

  const clearInFlight = (id: number, controller: AbortController): void => {
    // Only delete if the entry still belongs to THIS request. If a later
    // request reused the same JSON-RPC id (overwriting the entry), deleting
    // unconditionally would drop the newer request's controller and break its
    // cancellation/cleanup.
    if (inFlightRequests.get(id)?.controller === controller) {
      inFlightRequests.delete(id)
    }
  }

  // EIP-2255: the accounts/permissions to advertise for this origin. The
  // injected signer is active-only, so we mirror the passive accountsChanged
  // reconciliation here: if the wallet's active account is granted, return the
  // granted set (active sorted first) — switching among granted accounts never
  // re-prompts (multi-account, Phase 3c). If the active account is NOT granted,
  // return [] so the connect/permission handlers don't tell the dApp it's
  // connected to an address the active-only signer can't authorize (CP-14382).
  // The shared helper keeps this identical to the hook's switch-effect / prime
  // path, so the active and passive paths never disagree.
  const resolveActiveConnectedAddresses = (origin: string): string[] =>
    resolveActiveConnectedAccounts(
      getGrantedAddresses({ domain: origin, vmType: NetworkVMType.EVM }),
      getActiveAccount()?.addressC
    )

  // Read-only methods (eth_call, eth_getBalance, …) are dispatched to the VM
  // module — the same source WalletConnect uses — instead of a bespoke fetch +
  // allowlist. The module classifies/validates the method against its manifest
  // and proxies the request to the per-tab browser network's RPC endpoint.
  const dispatchReadOnly = async (
    id: number,
    method: string,
    params: unknown[]
  ): Promise<void> => {
    try {
      const result = await requestReadOnly({
        id,
        method,
        params,
        chainId: getBrowserNetwork().chainId
      })
      sendResponse(id, null, result)
    } catch (e) {
      // requestReadOnly rejects with an RpcError for known cases (methodNotFound
      // for unsupported methods, internal otherwise); any other thrown value is
      // serialized by sendResponse, which preserves a numeric code when present.
      sendResponse(id, e, undefined)
    }
  }

  const dispatchSigningRequest = async (
    id: number,
    method: string,
    params: unknown[]
  ): Promise<void> => {
    const rpcMethod = signingMethodFor(method)
    if (!rpcMethod) {
      sendResponse(
        id,
        rpcErrors.methodNotFound(`Method not supported: ${method}`),
        undefined
      )
      return
    }

    const caip2ChainId = getEvmCaip2ChainId(getBrowserNetwork().chainId)
    const origin = getNativeOrigin()
    // gated by handleProviderMessage (rejects 4100 when absent); never register
    // a synthetic '' so cancelByOrigin comparisons stay meaningful.
    if (!origin) return

    // Every account this request will be signed with must be granted to the
    // origin. The approval screen resolves the signer from the address the
    // request carries (selectAccountByAddress) — the tx `from`, or a message-
    // sign method's signer-address arg — falling back to the active account when
    // none is given. Reject up front, no prompt, if any of those isn't granted:
    // the injected provider must never sign — a tx OR a message (e.g. a Permit /
    // signTypedData, which can authorize transfers off-chain) — with an account
    // the dApp was never granted (An's repro: connected as account 2, then
    // eth_sendTransaction with from = account 1). A granted account that isn't
    // currently active is fine — the dApp has permission for it. CP-14382.
    const grantedAddresses = new Set(
      getGrantedAddresses({ domain: origin, vmType: NetworkVMType.EVM }).map(
        addr => addr.toLowerCase()
      )
    )
    const requestedSigners = requestedSignerAddresses(rpcMethod, params)
    const signerAddresses =
      requestedSigners.length > 0
        ? requestedSigners
        : [getActiveAccount()?.addressC].filter((addr): addr is string =>
            Boolean(addr)
          )
    const allSignersGranted =
      signerAddresses.length > 0 &&
      signerAddresses.every(addr => grantedAddresses.has(addr.toLowerCase()))
    if (!allSignersGranted) {
      sendResponse(
        id,
        providerErrors.unauthorized(
          'Account not granted access to this origin'
        ),
        undefined
      )
      return
    }

    const controller = registerInFlight(id, origin)

    try {
      const result = await requestSigning({
        method: rpcMethod,
        params,
        chainId: caip2ChainId,
        peerMeta: getPeerMeta(),
        signal: controller.signal
      })
      sendResponse(id, null, result)
    } catch (e) {
      sendResponse(id, e, undefined)
    } finally {
      clearInFlight(id, controller)
    }
  }

  // First-party avalanche account methods (avalanche_getAccounts /
  // _selectAccount / _getAccountPubKey). First-party access is already enforced
  // in handleProviderMessage, so authorization is settled by the time we get
  // here (D5 — the first-party origin IS the authorization; no per-address grant
  // check like the EVM signing path runs). They go through the same in-app
  // request bridge (`requestSigning` = createInAppRequest) as signing, but
  // resolve to dedicated handlers that read wallet state with no approval. No
  // chainId is passed: the handler is found by method, and these methods are
  // network-independent. Registered as in-flight so a cross-origin navigation
  // rejects the pending request (and the response is origin-gated by
  // sendResponse regardless). Note: these handlers run synchronously with no
  // approval step, so by the time an abort fires the work is already done — an
  // abort cancels the pending RESPONSE, not e.g. an already-applied
  // selectAccount switch. That's acceptable: the methods are first-party-only
  // and benign (read state / switch the active account — no signing or funds).
  // CP-13672.
  const dispatchAvalancheAccountMethod = async (
    id: number,
    method: string,
    params: unknown[]
  ): Promise<void> => {
    const origin = getNativeOrigin()
    if (!origin) return
    const controller = registerInFlight(id, origin)
    try {
      const result = await requestSigning({
        method: method as unknown as RpcMethod,
        params,
        peerMeta: getPeerMeta(),
        signal: controller.signal
      })
      sendResponse(id, null, result)
    } catch (e) {
      sendResponse(id, e, undefined)
    } finally {
      clearInFlight(id, controller)
    }
  }

  // First-party avalanche signing (avalanche_sendTransaction / _signTransaction
  // / _signMessage). First-party access is enforced in handleProviderMessage, so
  // no per-address grant check runs (D5 — first-party origin IS the
  // authorization; the EVM signer-grant gate does not apply to X/P). The request
  // carries an OBJECT params with a top-level `chainAlias`; we derive the
  // AVAX-namespace CAIP-2 from it (D3) — for the current dev-mode environment —
  // and pass it as the request scope so ModuleManager loads the avalanche module
  // (not the EVM one) and the approval screen shows the right chain. `params` is
  // forwarded RAW (never the array-coerced safeParams) so `chainAlias` and the
  // tx/message payload survive. Goes through the approval screen via the same
  // in-app bridge as EVM signing. CP-13672.
  const dispatchAvalancheSigningRequest = async (
    id: number,
    method: string,
    params: unknown
  ): Promise<void> => {
    const chainAlias = (params as { chainAlias?: unknown } | null | undefined)
      ?.chainAlias
    if (!isAvalancheChainAlias(chainAlias)) {
      sendResponse(
        id,
        rpcErrors.invalidParams(
          'avalanche signing requires a chainAlias of X, P, or C'
        ),
        undefined
      )
      return
    }
    const origin = getNativeOrigin()
    // gated upstream; never register a synthetic '' origin.
    if (!origin) return

    // Environment (Fuji vs mainnet) is read here at dispatch. The downstream
    // handler re-reads dev mode when deriving the signer's XP addresses, so a
    // dev-mode toggle in the tiny window mid-request would, at worst, fail the
    // signature — never misdirect funds. Same two-read pattern as the WC path.
    const caip2ChainId = getAvalancheChainAliasCaip2(
      chainAlias,
      getIsDeveloperMode()
    )
    const controller = registerInFlight(id, origin)
    try {
      const result = await requestSigning({
        method: method as unknown as RpcMethod,
        params,
        chainId: caip2ChainId,
        peerMeta: getPeerMeta(),
        signal: controller.signal
      })
      sendResponse(id, null, result)
    } catch (e) {
      sendResponse(id, e, undefined)
    } finally {
      clearInFlight(id, controller)
    }
  }

  const handleSwitchEthereumChain = (id: number, params: unknown[]): void => {
    const param = params[0] as { chainId?: string } | undefined
    const hexChainId = param?.chainId
    if (!hexChainId) {
      sendResponse(
        id,
        rpcErrors.invalidParams('Missing chainId param'),
        undefined
      )
      return
    }
    const requestedChainId = parseInt(hexChainId, 16)
    if (isNaN(requestedChainId)) {
      sendResponse(id, rpcErrors.invalidParams('Invalid chainId'), undefined)
      return
    }
    const allNetworks = getAllNetworks()
    if (!(String(requestedChainId) in allNetworks)) {
      // Return 4902 (unrecognized chain) so ConnectKit/wagmi can trigger the
      // wallet_addEthereumChain flow instead. The shim already fired
      // chainChanged(target) optimistically and will not roll it back, so
      // wagmi's chain state stays at target — preventing ConnectKit from
      // re-triggering switchChain in a loop (React error #185).
      sendResponse(
        id,
        {
          code: 4902,
          message: `Chain ${requestedChainId} has not been added to your wallet.`
        },
        undefined
      )
      return
    }
    if (requestedChainId === getBrowserNetwork().chainId) {
      sendResponse(id, null, null)
      return
    }
    // Persist the chain switch for this tab only (survives tab eviction/remount).
    // The browser network ensures all subsequent RPC calls in this session are
    // routed to the correct chain. The shim already fired chainChanged
    // synchronously before the round-trip (prevents React #185 loop), so we
    // do NOT re-emit it here.
    const switchedNetwork = allNetworks[requestedChainId]
    dispatch(setTabChainId({ tabId, chainId: requestedChainId }))
    setBrowserNetwork({
      chainId: requestedChainId,
      rpcUrl: switchedNetwork?.rpcUrl ?? ''
    })
    sendResponse(id, null, null)
  }

  const handleAddEthereumChain = async (
    id: number,
    params: unknown[]
  ): Promise<void> => {
    const addParam = params[0] as
      | { chainId?: string; rpcUrls?: string[] }
      | undefined
    const addHexChainId = addParam?.chainId
    const addRpcUrl = addParam?.rpcUrls?.[0]
    const origin = getNativeOrigin()
    // gated by handleProviderMessage (rejects 4100 when absent); never register
    // a synthetic '' so cancelByOrigin comparisons stay meaningful.
    if (!origin) return
    const controller = registerInFlight(id, origin)
    try {
      await requestSigning({
        method: 'wallet_addEthereumChain' as unknown as RpcMethod,
        params,
        chainId: getEvmCaip2ChainId(getBrowserNetwork().chainId),
        peerMeta: getPeerMeta(),
        signal: controller.signal
      })
      // User approved — switch browser chain to the new network and notify dApp
      if (addHexChainId) {
        const newChainId = parseInt(addHexChainId, 16)
        if (!isNaN(newChainId)) {
          const addedNetwork = getAllNetworks()[newChainId]
          setBrowserNetwork({
            chainId: newChainId,
            rpcUrl: addedNetwork?.rpcUrl ?? addRpcUrl ?? ''
          })
          dispatch(setTabChainId({ tabId, chainId: newChainId }))
          emitEvent('chainChanged', addHexChainId)
        }
      }
      sendResponse(id, null, null)
    } catch (e) {
      sendResponse(id, e, undefined)
    } finally {
      clearInFlight(id, controller)
    }
  }

  const handleRequestAccounts = async (id: number): Promise<void> => {
    const origin = getNativeOrigin()
    if (!origin) {
      sendResponse(
        id,
        providerErrors.unauthorized('Origin unavailable — cannot connect'),
        undefined
      )
      return
    }
    const active = getActiveAccount()
    if (!active?.addressC) {
      sendResponse(
        id,
        providerErrors.unauthorized('No active account'),
        undefined
      )
      return
    }

    // Short-circuit only when the active account is itself granted — return the
    // granted set (active first) without prompting. If the active account is
    // ungranted, fall through to the approval prompt rather than reporting a
    // connection the active-only signer can't honor (keeps this consistent with
    // the accountsChanged([]) reconciliation).
    const connected = resolveActiveConnectedAddresses(origin)
    if (connected.length > 0) {
      sendResponse(id, null, connected)
      return
    }

    try {
      const peerMeta = getPeerMeta()
      const selected = await requestConnectApproval(peerMeta, id)
      let anyGranted = false
      for (const account of selected) {
        if (!account.addressC) continue
        grantPermission({
          domain: origin,
          address: account.addressC,
          vmType: NetworkVMType.EVM
        })
        anyGranted = true
      }
      // Advertise the reconciled set, not the raw selection. The injected signer
      // is active-only, so report [active, ...granted] when the active account is
      // among the grants, and reject otherwise — never tell the dApp it's
      // connected to an address Core won't sign for (phantom connection,
      // CP-14382). Grants for non-active selections still persist, so switching
      // to one later connects without re-prompting.
      const reconciled = resolveActiveConnectedAddresses(origin)
      if (!anyGranted) {
        // No account approved → genuine user rejection (4001).
        sendResponse(id, providerErrors.userRejectedRequest(), undefined)
        return
      }
      if (reconciled.length === 0) {
        // Approved, but the active account isn't among the grants: an
        // authorization failure (the dApp would otherwise be told about an
        // account the active-only signer can't honor), not a user cancel. Use
        // 4100 so dApps treat it as "not connected" rather than "rejected".
        sendResponse(
          id,
          providerErrors.unauthorized(
            'Active account not granted for this origin'
          ),
          undefined
        )
        return
      }
      // Emit accountsChanged before resolving the Promise — matches
      // MetaMask/Rabby ordering so wagmi listeners see the event alongside
      // the resolution rather than one render later.
      emitEvent('accountsChanged', reconciled)
      sendResponse(id, null, reconciled)
    } catch (e) {
      sendResponse(id, e, undefined)
    }
  }

  // EIP-2255: `wallet_requestPermissions` is user-visible permissions gate.
  // Behaves identically to `eth_requestAccounts` in our scope (only capability
  // is `eth_accounts`); response shape differs (array of Permission objects).
  const handleRequestPermissions = async (id: number): Promise<void> => {
    const origin = getNativeOrigin()
    if (!origin) {
      sendResponse(
        id,
        providerErrors.unauthorized('Origin unavailable — cannot connect'),
        undefined
      )
      return
    }
    const active = getActiveAccount()
    if (!active?.addressC) {
      sendResponse(
        id,
        providerErrors.unauthorized('No active account'),
        undefined
      )
      return
    }

    // Same active-account gate as eth_requestAccounts: only short-circuit when
    // the active account is granted; otherwise prompt.
    const connected = resolveActiveConnectedAddresses(origin)
    if (connected.length > 0) {
      sendResponse(id, null, buildAccountsPermission(connected))
      return
    }

    try {
      const peerMeta = getPeerMeta()
      const selected = await requestConnectApproval(peerMeta, id)
      let anyGranted = false
      for (const account of selected) {
        if (!account.addressC) continue
        grantPermission({
          domain: origin,
          address: account.addressC,
          vmType: NetworkVMType.EVM
        })
        anyGranted = true
      }
      // Reconcile against the active account before returning permissions — same
      // active-only reasoning as handleRequestAccounts: never return a permission
      // set for an address the injected signer won't use (phantom connection,
      // CP-14382).
      const reconciled = resolveActiveConnectedAddresses(origin)
      if (!anyGranted) {
        // No account approved → genuine user rejection (4001).
        sendResponse(id, providerErrors.userRejectedRequest(), undefined)
        return
      }
      if (reconciled.length === 0) {
        // Approved, but the active account isn't among the grants: an
        // authorization failure (the dApp would otherwise be told about an
        // account the active-only signer can't honor), not a user cancel. Use
        // 4100 so dApps treat it as "not connected" rather than "rejected".
        sendResponse(
          id,
          providerErrors.unauthorized(
            'Active account not granted for this origin'
          ),
          undefined
        )
        return
      }
      // Emit accountsChanged before resolving the Promise (see handleRequestAccounts).
      emitEvent('accountsChanged', reconciled)
      sendResponse(id, null, buildAccountsPermission(reconciled))
    } catch (e) {
      sendResponse(id, e, undefined)
    }
  }

  const handleGetPermissions = (id: number): void => {
    const origin = getNativeOrigin()
    if (!origin) {
      sendResponse(id, null, [])
      return
    }
    // Returns [] when the active account isn't granted, so a dApp that polls
    // wallet_getPermissions sees a disconnected state consistent with the
    // accountsChanged([]) reconciliation (never a phantom connection).
    sendResponse(
      id,
      null,
      buildAccountsPermission(resolveActiveConnectedAddresses(origin))
    )
  }

  const handleRevokePermissions = (id: number): void => {
    const origin = getNativeOrigin()
    if (origin) {
      // Whole-domain revoke (address omitted) — drops grants for every
      // address previously approved at this origin, not just the active
      // one. Matches MetaMask's "Disconnect this site" UX. When multi-
      // account selection is introduced, revisit whether a narrower revoke
      // is warranted.
      revokePermission({ domain: origin })
    }
    // Only emit accountsChanged([]) — NOT disconnect. Per EIP-1193,
    // 'disconnect' means the provider lost network connectivity, not
    // that the user revoked access. Emitting disconnect causes wagmi
    // to mark the provider as offline and refuse to auto-reconnect.
    emitEvent('accountsChanged', [])
    sendResponse(id, null, null)
  }

  const handleWatchAsset = async (
    id: number,
    params: unknown[] | unknown
  ): Promise<void> => {
    // Normalize: some dApps send object form { type, options } instead of array
    const normalizedParams = Array.isArray(params) ? params : [params]
    const origin = getNativeOrigin()
    // gated by handleProviderMessage (rejects 4100 when absent); never register
    // a synthetic '' so cancelByOrigin comparisons stay meaningful.
    if (!origin) return
    const controller = registerInFlight(id, origin)
    try {
      const result = await requestSigning({
        method: 'wallet_watchAsset' as unknown as RpcMethod,
        params: normalizedParams,
        chainId: getEvmCaip2ChainId(getBrowserNetwork().chainId),
        peerMeta: getPeerMeta(),
        signal: controller.signal
      })
      sendResponse(id, null, result)
    } catch (e) {
      // EIP-747: explicit user rejection returns false; all other
      // errors (invalid params, internal) are surfaced as real RPC errors
      if (isUserRejectedRpcError(e)) {
        sendResponse(id, null, false)
      } else {
        sendResponse(id, e, undefined)
      }
    } finally {
      clearInFlight(id, controller)
    }
  }

  const dispatchMethod = (
    id: number,
    method: string,
    params: unknown
  ): void => {
    // Ensure params is always an array for handlers that expect one.
    // wallet_watchAsset is the only method that legitimately accepts object-form
    // params (some dApps send { type, options } instead of [{ type, options }]);
    // its handler normalizes internally.
    const safeParams = Array.isArray(params) ? params : []
    if (method === 'eth_requestAccounts') {
      handleRequestAccounts(id)
    } else if (method === 'wallet_requestPermissions') {
      handleRequestPermissions(id)
    } else if (method === 'wallet_getPermissions') {
      handleGetPermissions(id)
    } else if (method === 'wallet_switchEthereumChain') {
      handleSwitchEthereumChain(id, safeParams)
    } else if (method === 'wallet_addEthereumChain') {
      handleAddEthereumChain(id, safeParams)
    } else if (method === 'wallet_revokePermissions') {
      handleRevokePermissions(id)
    } else if (method === 'wallet_watchAsset') {
      handleWatchAsset(id, params)
    } else if (isAvalancheAccountMethod(method)) {
      dispatchAvalancheAccountMethod(id, method, safeParams)
    } else if (isAvalancheSigningMethod(method)) {
      // RAW params (NOT safeParams): avalanche signing uses object params whose
      // top-level chainAlias would be lost by the array coercion.
      dispatchAvalancheSigningRequest(id, method, params)
    } else if (signingMethodFor(method)) {
      dispatchSigningRequest(id, method, safeParams)
    } else {
      // Anything not injected-specific and not a signing method is treated as
      // read-only and validated by the VM module's manifest (unsupported
      // methods reject with methodNotFound).
      dispatchReadOnly(id, method, safeParams)
    }
  }

  const handleProviderMessage = (payload: string): void => {
    const respondWithError = (reqId: number, error: unknown): void =>
      sendResponse(reqId, error, undefined)

    const parsed = parseProviderPayload(payload, respondWithError)
    if (!parsed) return

    const { id, origin: pageOrigin, request: rpc } = parsed
    const { method, params } = rpc

    const nativeOrigin = getNativeOrigin()

    // Origin mismatch — the shim-reported origin disagrees with the origin
    // tracked by the WebView's navigation state. Either a race during
    // cross-origin navigation (rare) or a sign the page is trying to spoof
    // its origin (hostile). Either way, refuse the request.
    //
    // Note: if the shim provides `pageOrigin` but `nativeOrigin` is missing
    // (e.g., first RPC arrives before onNavigationStateChange has fired),
    // we deliberately fall through to the `!nativeOrigin` gate below. We
    // can't verify the shim's claim without a native anchor, so 4100
    // "unauthorized" is the right response — not "invalidRequest," since
    // the payload itself is well-formed.
    //
    // `origin` isn't type-checked by validateProviderRequest, so require a
    // string here: a truthy non-string would otherwise always be `!==` the
    // native origin and trip this branch with noisy logs / bogus rejections.
    // A non-string origin is treated like an absent one — the request still
    // gates on the trusted nativeOrigin below (the real anchor; pageOrigin is
    // only the extra spoof-detection layer).
    if (
      typeof pageOrigin === 'string' &&
      nativeOrigin &&
      pageOrigin !== nativeOrigin
    ) {
      Logger.warn(
        `[InjectedProvider] Origin mismatch rejected: page=${pageOrigin} native=${nativeOrigin}`
      )
      sendResponse(id, rpcErrors.invalidRequest('Origin mismatch'), undefined)
      return
    }

    Logger.trace(`[InjectedProvider] ${method}`, params)

    // Method validity is no longer gated by a static allowlist: injected and
    // signing methods are handled explicitly in dispatchMethod, and read-only
    // methods are validated by the VM module's manifest (unsupported →
    // methodNotFound). Origin must still be verified first, below.

    // Every method requires a known native origin. Requests that arrive
    // before the WebView has reported its first URL, or from an iframe or
    // about:blank context, have no authoritative origin to gate on — reject
    // rather than silently treat them as unscoped.
    if (!nativeOrigin) {
      sendResponse(
        id,
        providerErrors.unauthorized('Origin unavailable'),
        undefined
      )
      return
    }

    // First-party gate (CP-13672): avalanche_* (X/P account management +
    // signing) is restricted to Core's own surfaces (core.app / AvaCloud / dev).
    // Any other origin is rejected here, BEFORE dispatchMethod, so an untrusted
    // page can never reach the account/signing handlers behind the gate. We
    // return methodNotFound rather than a permission error so the rejection is
    // indistinguishable from the method not existing — a third-party page can't
    // even detect that the capability is there. EVM methods are unaffected.
    if (isAvalancheMethod(method) && !isFirstPartyOrigin(nativeOrigin)) {
      Logger.warn(
        `[InjectedProvider] avalanche_* rejected for non-first-party origin: ${nativeOrigin}`
      )
      sendResponse(
        id,
        rpcErrors.methodNotFound(`Method not supported: ${method}`),
        undefined
      )
      return
    }

    trackPendingOrigin(id, nativeOrigin)

    dispatchMethod(id, method, params)
  }

  const cancelByOrigin = (currentOrigin: string | undefined): void => {
    // Record where the page navigated to, so a signing request that registers
    // AFTER this edge (and would be missed by the loop below) is aborted on
    // arrival in registerInFlight. (CP-14422)
    liveOrigin = currentOrigin
    if (inFlightRequests.size === 0) return
    for (const [id, entry] of inFlightRequests.entries()) {
      if (entry.origin !== currentOrigin) {
        entry.controller.abort()
        inFlightRequests.delete(id)
      }
    }
  }

  return { handleProviderMessage, cancelByOrigin }
}
