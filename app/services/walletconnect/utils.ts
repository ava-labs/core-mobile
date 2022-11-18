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
