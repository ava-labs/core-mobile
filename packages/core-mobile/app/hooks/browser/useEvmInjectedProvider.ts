import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account/slice'
import {
  selectActiveNetwork,
  selectAllNetworks,
  setActive
} from 'store/network/slice'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import RNWebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { PeerMeta } from 'store/rpc/types'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import { buildEvmProviderShim } from './evmProviderShim'
import { getInjectedProviderUuid } from './getInjectedProviderUuid'

export const MAX_MESSAGE_SIZE = 1_048_576

type ProviderRequest = {
  id: number
  origin?: string
  request: {
    method: string
    params: unknown[]
  }
}

type DomainMetadata = {
  domain: string
  name: string
  icon: string
  url: string
}

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
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_revokePermissions'
])

function validateProviderRequest(data: unknown): data is ProviderRequest {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (typeof obj.id !== 'number') return false
  if (typeof obj.request !== 'object' || obj.request === null) return false
  const req = obj.request as Record<string, unknown>
  return typeof req.method === 'string'
}

function getOriginFromUrl(url: string): string | undefined {
  if (!url) return undefined
  try {
    const origin = new URL(url).origin
    return origin !== 'null' ? origin : undefined
  } catch {
    return undefined
  }
}

function parseProviderPayload(
  payload: string,
  respondWithError: (id: number, error: unknown) => void
): ProviderRequest | undefined {
  if (payload.length > MAX_MESSAGE_SIZE) {
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
    const maybeId = (parsed as Record<string, unknown>)?.id
    if (typeof maybeId === 'number') {
      respondWithError(maybeId, rpcErrors.invalidRequest('Malformed request'))
    }
    return undefined
  }

  return parsed
}

/**
 * Hook providing EVM injected provider functionality for the in-app browser.
 *
 * Signing methods (personal_sign, eth_sendTransaction, etc.) are dispatched
 * through the existing RPC system which shows the approval screen.
 * Read-only methods are proxied directly to the network RPC endpoint.
 */
export function useEvmInjectedProvider(
  webViewRef: React.RefObject<RNWebView | null>
) {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const allNetworks = useSelector(selectAllNetworks)
  const dappMetadata = useRef<DomainMetadata | null>(null)
  const currentUrlRef = useRef<string>('')
  const pendingOrigins = useRef<Map<number, string>>(new Map())
  const browserNetworkRef = useRef({
    chainId: activeNetwork.chainId,
    rpcUrl: activeNetwork.rpcUrl
  })

  const setCurrentUrl = useCallback((url: string) => {
    currentUrlRef.current = url
  }, [])

  const chainIdHex = useMemo(() => {
    if (activeNetwork.vmName !== NetworkVMType.EVM) return '0x1'
    return '0x' + activeNetwork.chainId.toString(16)
  }, [activeNetwork])

  const evmAddress = activeAccount?.addressC ?? ''

  const providerShimJs = useMemo(() => {
    return buildEvmProviderShim({
      chainId: chainIdHex,
      address: evmAddress,
      uuid: getInjectedProviderUuid()
    })
  }, [chainIdHex, evmAddress])

  const sendResponse = useCallback(
    (id: number, error: unknown, result: unknown) => {
      let errorPayload: { code: number; message: string } | null = null
      if (error != null) {
        const err = error as Record<string, unknown>
        if (
          typeof err.code === 'number' &&
          Number.isInteger(err.code) &&
          typeof err.message === 'string'
        ) {
          errorPayload = {
            code: err.code,
            message: err.message
          }
        } else {
          const serialized = serializeError(error, {
            shouldIncludeStack: false
          })
          errorPayload = {
            code: serialized.code,
            message: serialized.message
          }
        }
      }
      const errorJson = errorPayload ? JSON.stringify(errorPayload) : 'null'
      const resultJson = result !== undefined ? JSON.stringify(result) : 'null'
      const call = `window.__coreProviderRespond(${id}, ${errorJson}, ${resultJson});`

      const expectedOrigin = pendingOrigins.current.get(id)
      pendingOrigins.current.delete(id)

      // Gate response delivery: if we recorded the page origin at request
      // time, only deliver if the page is still on the same origin
      // (prevents leaking response data after cross-origin navigation).
      const js = expectedOrigin
        ? `if(window.location.origin===${JSON.stringify(
            expectedOrigin
          )}){${call}}true;`
        : `${call} true;`

      webViewRef.current?.injectJavaScript(js)
    },
    [webViewRef]
  )

  const emitEvent = useCallback(
    (eventName: string, data: unknown) => {
      const dataJson = JSON.stringify(data)
      const js = `window.__coreProviderEmit('${eventName}', ${dataJson}); true;`
      webViewRef.current?.injectJavaScript(js)
    },
    [webViewRef]
  )

  const proxyToRpc = useCallback(
    async (id: number, method: string, params: unknown[]) => {
      try {
        const rpcUrl = browserNetworkRef.current.rpcUrl
        if (!rpcUrl) {
          sendResponse(
            id,
            rpcErrors.internal('No RPC URL configured'),
            undefined
          )
          return
        }

        const body = JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params
        })

        const response = await fetch(rpcUrl, {
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
    },
    [sendResponse]
  )

  const buildDappPeerMeta = useCallback((): PeerMeta | undefined => {
    const meta = dappMetadata.current
    const nativeUrl = currentUrlRef.current
    if (!meta && !nativeUrl) return undefined

    return {
      name: meta?.name ?? new URL(nativeUrl).hostname,
      description: '',
      url: nativeUrl || meta?.url || '',
      icons: meta?.icon ? [meta.icon] : []
    }
  }, [])

  const dispatchSigningRequest = useCallback(
    async (id: number, method: string, params: unknown[]) => {
      const rpcMethod = SIGNING_METHODS[method]
      if (!rpcMethod) {
        sendResponse(
          id,
          rpcErrors.methodNotFound(`Method not supported: ${method}`),
          undefined
        )
        return
      }

      const caip2ChainId = getEvmCaip2ChainId(browserNetworkRef.current.chainId)
      const request = createInAppRequest(dispatch)

      try {
        const result = await request({
          method: rpcMethod,
          params,
          chainId: caip2ChainId,
          peerMeta: buildDappPeerMeta()
        })
        sendResponse(id, null, result)
      } catch (e) {
        sendResponse(id, e, undefined)
      }
    },
    [dispatch, sendResponse, buildDappPeerMeta]
  )

  const handleSwitchEthereumChain = useCallback(
    (id: number, params: unknown[]) => {
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
      if (requestedChainId === browserNetworkRef.current.chainId) {
        sendResponse(id, null, null)
        return
      }
      // Auto-approve: update Redux so the chain persists across page reloads,
      // then sync browserNetworkRef so subsequent RPC calls (read-only and signing)
      // are routed to the correct chain. The shim already fired chainChanged
      // synchronously before the round-trip (prevents React #185 loop), so we
      // do NOT re-emit it here.
      const switchedNetwork = allNetworks[requestedChainId]
      dispatch(setActive(requestedChainId))
      browserNetworkRef.current = {
        chainId: requestedChainId,
        rpcUrl: switchedNetwork?.rpcUrl ?? ''
      }
      sendResponse(id, null, null)
    },
    [sendResponse, allNetworks, dispatch]
  )

  const handleAddEthereumChain = useCallback(
    async (id: number, params: unknown[]) => {
      const addParam = params[0] as
        | { chainId?: string; rpcUrls?: string[] }
        | undefined
      const addHexChainId = addParam?.chainId
      const addRpcUrl = addParam?.rpcUrls?.[0]
      const inAppRequest = createInAppRequest(dispatch)
      try {
        await inAppRequest({
          method: 'wallet_addEthereumChain' as unknown as RpcMethod,
          params,
          chainId: getEvmCaip2ChainId(browserNetworkRef.current.chainId),
          peerMeta: buildDappPeerMeta()
        })
        // User approved — switch browser chain to the new network and notify dApp
        if (addHexChainId) {
          const newChainId = parseInt(addHexChainId, 16)
          if (!isNaN(newChainId)) {
            const addedNetwork = allNetworks[newChainId]
            browserNetworkRef.current = {
              chainId: newChainId,
              rpcUrl: addedNetwork?.rpcUrl ?? addRpcUrl ?? ''
            }
            emitEvent('chainChanged', addHexChainId)
          }
        }
        sendResponse(id, null, null)
      } catch (e) {
        sendResponse(id, e, undefined)
      }
    },
    [sendResponse, allNetworks, dispatch, emitEvent, buildDappPeerMeta]
  )

  const handleRevokePermissions = useCallback(
    (id: number) => {
      emitEvent('accountsChanged', [])
      emitEvent('disconnect', { code: 4900, message: 'User disconnected' })
      sendResponse(id, null, null)
    },
    [emitEvent, sendResponse]
  )

  const handleProviderMessage = useCallback(
    async (payload: string) => {
      const respondWithError = (id: number, error: unknown): void =>
        sendResponse(id, error, undefined)

      const parsed = parseProviderPayload(payload, respondWithError)
      if (!parsed) return

      const { id, origin: pageOrigin, request: rpc } = parsed
      const { method, params } = rpc

      const nativeOrigin = getOriginFromUrl(currentUrlRef.current)
      if (pageOrigin && nativeOrigin && pageOrigin !== nativeOrigin) {
        Logger.warn(
          `[InjectedProvider] Origin mismatch: page=${pageOrigin} native=${nativeOrigin}`
        )
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

      if (nativeOrigin) {
        pendingOrigins.current.set(id, nativeOrigin)
      } else if (method in SIGNING_METHODS) {
        // Signing methods require a verified page origin — reject without one.
        sendResponse(
          id,
          rpcErrors.internal('Origin unavailable — cannot sign'),
          undefined
        )
        return
      }

      if (method === 'wallet_switchEthereumChain') {
        handleSwitchEthereumChain(id, params ?? [])
      } else if (method === 'wallet_addEthereumChain') {
        await handleAddEthereumChain(id, params ?? [])
      } else if (method === 'wallet_revokePermissions') {
        handleRevokePermissions(id)
      } else if (method in SIGNING_METHODS) {
        dispatchSigningRequest(id, method, params ?? [])
      } else if (READ_ONLY_METHODS.has(method)) {
        proxyToRpc(id, method, params ?? [])
      }
    },
    [
      sendResponse,
      proxyToRpc,
      dispatchSigningRequest,
      handleSwitchEthereumChain,
      handleAddEthereumChain,
      handleRevokePermissions
    ]
  )

  const handleDomainMetadata = useCallback((payload: string) => {
    try {
      dappMetadata.current = JSON.parse(payload)
      Logger.trace('[InjectedProvider] domain_metadata', dappMetadata.current)
    } catch {
      Logger.error('[InjectedProvider] Invalid domain_metadata payload')
    }
  }, [])

  return {
    providerShimJs,
    handleProviderMessage,
    handleDomainMetadata,
    emitEvent,
    dappMetadata,
    setCurrentUrl
  }
}
