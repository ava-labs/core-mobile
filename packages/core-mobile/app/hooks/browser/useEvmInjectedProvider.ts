import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account/slice'
import { selectActiveNetwork } from 'store/network/slice'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import RNWebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { buildEvmProviderShim } from './evmProviderShim'

type ProviderRequest = {
  id: number
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
  const dappMetadata = useRef<DomainMetadata | null>(null)

  const chainIdHex = useMemo(() => {
    if (activeNetwork.vmName !== NetworkVMType.EVM) return '0x1'
    return '0x' + activeNetwork.chainId.toString(16)
  }, [activeNetwork])

  const evmAddress = activeAccount?.addressC ?? ''

  const providerShimJs = useMemo(() => {
    return buildEvmProviderShim({
      chainId: chainIdHex,
      address: evmAddress
    })
  }, [chainIdHex, evmAddress])

  const sendResponse = useCallback(
    (id: number, error: unknown, result: unknown) => {
      const errorJson = error ? JSON.stringify(error) : 'null'
      const resultJson = result !== undefined ? JSON.stringify(result) : 'null'
      const js = `window.__coreProviderRespond(${id}, ${errorJson}, ${resultJson}); true;`
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
        const rpcUrl = activeNetwork.rpcUrl
        if (!rpcUrl) {
          sendResponse(
            id,
            { code: -32603, message: 'No RPC URL configured' },
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
        sendResponse(
          id,
          { code: -32603, message: 'RPC request failed' },
          undefined
        )
      }
    },
    [activeNetwork.rpcUrl, sendResponse]
  )

  const dispatchSigningRequest = useCallback(
    async (id: number, method: string, params: unknown[]) => {
      const rpcMethod = SIGNING_METHODS[method]
      if (!rpcMethod) {
        sendResponse(
          id,
          { code: -32601, message: `Method not supported: ${method}` },
          undefined
        )
        return
      }

      const caip2ChainId = getEvmCaip2ChainId(activeNetwork.chainId)
      const request = createInAppRequest(dispatch)

      try {
        const result = await request({
          method: rpcMethod,
          params,
          chainId: caip2ChainId
        })
        sendResponse(id, null, result)
      } catch (e) {
        const error = e as { code?: number; message?: string }
        sendResponse(
          id,
          {
            code: error.code ?? 4001,
            message: error.message ?? 'User rejected'
          },
          undefined
        )
      }
    },
    [dispatch, activeNetwork.chainId, sendResponse]
  )

  const handleProviderMessage = useCallback(
    (payload: string) => {
      let parsed: ProviderRequest
      try {
        parsed = JSON.parse(payload)
      } catch {
        Logger.error('[InjectedProvider] Invalid provider_request payload')
        return
      }

      const { id, request } = parsed
      const { method, params } = request

      Logger.trace(`[InjectedProvider] ${method}`, params)

      // Connection methods (eth_requestAccounts, wallet_requestPermissions, etc.)
      // are handled entirely in the JS shim for instant response.
      // Only signing and read-only RPC methods reach native.
      if (method === 'wallet_switchEthereumChain') {
        Logger.info(
          '[InjectedProvider] wallet_switchEthereumChain requested (demo stub)'
        )
        sendResponse(id, null, null)
      } else if (method in SIGNING_METHODS) {
        dispatchSigningRequest(id, method, params ?? [])
      } else if (READ_ONLY_METHODS.has(method)) {
        proxyToRpc(id, method, params ?? [])
      } else {
        sendResponse(
          id,
          { code: -32601, message: `Method not supported: ${method}` },
          undefined
        )
      }
    },
    [sendResponse, proxyToRpc, dispatchSigningRequest]
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
    dappMetadata
  }
}
