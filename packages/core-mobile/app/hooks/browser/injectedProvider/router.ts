import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { setTabChainId } from 'store/browser/slices/tabs'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { isUserRejectedRpcError } from './errors'
import { MAX_MESSAGE_SIZE, ProviderRequest, RouterDeps } from './types'

const READ_ONLY_METHODS = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'eth_feeHistory',
  'web3_clientVersion',
  'web3_sha3',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber'
])

const SIGNING_METHODS: Record<string, RpcMethod> = {
  [RpcMethod.ETH_SEND_TRANSACTION]: RpcMethod.ETH_SEND_TRANSACTION,
  [RpcMethod.PERSONAL_SIGN]: RpcMethod.PERSONAL_SIGN,
  [RpcMethod.ETH_SIGN]: RpcMethod.ETH_SIGN,
  [RpcMethod.SIGN_TYPED_DATA]: RpcMethod.SIGN_TYPED_DATA,
  [RpcMethod.SIGN_TYPED_DATA_V1]: RpcMethod.SIGN_TYPED_DATA_V1,
  [RpcMethod.SIGN_TYPED_DATA_V3]: RpcMethod.SIGN_TYPED_DATA_V3,
  [RpcMethod.SIGN_TYPED_DATA_V4]: RpcMethod.SIGN_TYPED_DATA_V4
}

const ALLOWED_METHODS = new Set([
  ...READ_ONLY_METHODS,
  ...Object.keys(SIGNING_METHODS),
  'eth_requestAccounts',
  'wallet_requestPermissions',
  'wallet_getPermissions',
  'wallet_revokePermissions',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_watchAsset'
])

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
    sendResponse,
    emitEvent,
    getNativeOrigin,
    trackPendingOrigin,
    getPeerMeta,
    getActiveAccount,
    hasPermission,
    grantPermission,
    revokePermission,
    requestConnectApproval
  } = deps

  const proxyToRpc = async (
    id: number,
    method: string,
    params: unknown[]
  ): Promise<void> => {
    try {
      const rpcUrl = getBrowserNetwork().rpcUrl
      if (!rpcUrl) {
        sendResponse(id, rpcErrors.internal('No RPC URL configured'), undefined)
        return
      }

      const body = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params
      })

      const response = await nitroFetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })

      const json = await response.json()

      if (json.error) {
        sendResponse(id, json.error, undefined)
      } else {
        sendResponse(id, null, json.result)
      }
    } catch (e) {
      Logger.error('[InjectedProvider] RPC proxy error', e)
      sendResponse(id, rpcErrors.internal('RPC request failed'), undefined)
    }
  }

  const dispatchSigningRequest = async (
    id: number,
    method: string,
    params: unknown[]
  ): Promise<void> => {
    const rpcMethod = SIGNING_METHODS[method]
    if (!rpcMethod) {
      sendResponse(
        id,
        rpcErrors.methodNotFound(`Method not supported: ${method}`),
        undefined
      )
      return
    }

    const caip2ChainId = getEvmCaip2ChainId(getBrowserNetwork().chainId)

    try {
      const result = await requestSigning({
        method: rpcMethod,
        params,
        chainId: caip2ChainId,
        peerMeta: getPeerMeta()
      })
      sendResponse(id, null, result)
    } catch (e) {
      sendResponse(id, e, undefined)
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
    try {
      await requestSigning({
        method: 'wallet_addEthereumChain' as unknown as RpcMethod,
        params,
        chainId: getEvmCaip2ChainId(getBrowserNetwork().chainId),
        peerMeta: getPeerMeta()
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
    }
  }

  // EIP-2255: resolve permissions for the current origin against the active
  // EVM account. Today only `eth_accounts` is supported — there is no notion
  // of a restricted method beyond account access.
  const resolveActiveAccountAddresses = (origin: string): string[] => {
    const active = getActiveAccount()
    if (!active?.addressC) return []
    const granted = hasPermission({
      domain: origin,
      address: active.addressC,
      vmType: NetworkVMType.EVM
    })
    return granted ? [active.addressC] : []
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

    // Already connected: return without prompting.
    if (
      hasPermission({
        domain: origin,
        address: active.addressC,
        vmType: NetworkVMType.EVM
      })
    ) {
      sendResponse(id, null, [active.addressC])
      return
    }

    try {
      const peerMeta = getPeerMeta()
      const selected = await requestConnectApproval(peerMeta)
      const addresses: string[] = []
      for (const account of selected) {
        if (!account.addressC) continue
        grantPermission({
          domain: origin,
          address: account.addressC,
          vmType: NetworkVMType.EVM
        })
        addresses.push(account.addressC)
      }
      if (addresses.length === 0) {
        sendResponse(id, providerErrors.userRejectedRequest(), undefined)
        return
      }
      // Emit accountsChanged before resolving the Promise — matches
      // MetaMask/Rabby ordering so wagmi listeners see the event alongside
      // the resolution rather than one render later.
      emitEvent('accountsChanged', addresses)
      sendResponse(id, null, addresses)
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

    const alreadyGranted = hasPermission({
      domain: origin,
      address: active.addressC,
      vmType: NetworkVMType.EVM
    })

    if (alreadyGranted) {
      sendResponse(id, null, buildAccountsPermission([active.addressC]))
      return
    }

    try {
      const peerMeta = getPeerMeta()
      const selected = await requestConnectApproval(peerMeta)
      const addresses: string[] = []
      for (const account of selected) {
        if (!account.addressC) continue
        grantPermission({
          domain: origin,
          address: account.addressC,
          vmType: NetworkVMType.EVM
        })
        addresses.push(account.addressC)
      }
      if (addresses.length === 0) {
        sendResponse(id, providerErrors.userRejectedRequest(), undefined)
        return
      }
      // Emit accountsChanged before resolving the Promise (see handleRequestAccounts).
      emitEvent('accountsChanged', addresses)
      sendResponse(id, null, buildAccountsPermission(addresses))
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
    sendResponse(
      id,
      null,
      buildAccountsPermission(resolveActiveAccountAddresses(origin))
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
    try {
      const result = await requestSigning({
        method: 'wallet_watchAsset' as unknown as RpcMethod,
        params: normalizedParams,
        chainId: getEvmCaip2ChainId(getBrowserNetwork().chainId),
        peerMeta: getPeerMeta()
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
    } else if (method in SIGNING_METHODS) {
      dispatchSigningRequest(id, method, safeParams)
    } else if (READ_ONLY_METHODS.has(method)) {
      proxyToRpc(id, method, safeParams)
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
    if (pageOrigin && nativeOrigin && pageOrigin !== nativeOrigin) {
      Logger.warn(
        `[InjectedProvider] Origin mismatch rejected: page=${pageOrigin} native=${nativeOrigin}`
      )
      sendResponse(id, rpcErrors.invalidRequest('Origin mismatch'), undefined)
      return
    }

    Logger.trace(`[InjectedProvider] ${method}`, params)

    if (!ALLOWED_METHODS.has(method)) {
      sendResponse(
        id,
        rpcErrors.methodNotFound(`Unsupported method: ${method}`),
        undefined
      )
      return
    }

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

    trackPendingOrigin(id, nativeOrigin)

    dispatchMethod(id, method, params)
  }

  return { handleProviderMessage }
}
