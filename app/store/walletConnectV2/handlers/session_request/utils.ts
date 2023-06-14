import { CORE_ONLY_METHODS, RpcMethod } from 'store/walletConnectV2/types'
import { z } from 'zod'

const CORE_WEB_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  'core.app',
  'test.core.app',
  'fantastic-goggles-c7f7e3c0.pages.github.io' // internal playground
]

const CORE_WEB_URLS_REGEX = [
  'https://[a-zA-Z0-9-]+\\.core-web\\.pages\\.dev', // for all https://*.core-web.pages.dev urls
  'https://ava-labs.github.io/extension-avalanche-playground'
]

export const isCoreMethod = (method: string) =>
  CORE_ONLY_METHODS.includes(method as RpcMethod)

export const isCoreDomain = (url: string) => {
  const hostname = new URL(url).hostname

  return (
    CORE_WEB_HOSTNAMES.includes(hostname) ||
    CORE_WEB_URLS_REGEX.some(regex => new RegExp(regex).test(url))
  )
}

const approveDataSchema = z.object({
  selectedAccounts: z.array(z.string()).nonempty()
})

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
