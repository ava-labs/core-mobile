import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { CORE_ONLY_METHODS, RpcMethod } from './types'

const CORE_WEB_URLS = [
  'https://core.app',
  'https://test.core.app',
  'http://localhost:3000'
]

const CORE_WEB_URLS_REGEX = [
  'https://[a-zA-Z0-9-]+\\.core-web\\.pages\\.dev' // for all https://*.core-web.pages.dev urls
]

export const isCoreMethod = (method: string) =>
  CORE_ONLY_METHODS.includes(method as RpcMethod)

export const isFromCoreWeb = (url: string) => {
  return (
    CORE_WEB_URLS.includes(url) ||
    CORE_WEB_URLS_REGEX.some(regex => new RegExp(regex).test(url))
  )
}

export const isRequestSupportedOnNetwork = (
  payload: JsonRpcRequest,
  activeNetwork: Network | undefined
): boolean => {
  const declineMethodsPattern = /(^eth_|_watchAsset$)/
  if (
    activeNetwork &&
    activeNetwork.vmName !== NetworkVMType.EVM &&
    declineMethodsPattern.test(payload.method)
  ) {
    return false
  }

  return true
}
