import { NetworkVMType } from '@avalabs/chains-sdk'
import { Networks } from 'store/network/types'
import { CORE_ONLY_METHODS, RpcMethod } from 'store/rpc/types'
import {
  SafeParseError,
  SafeParseSuccess,
  z,
  ZodArray,
  ZodNumber,
  ZodString
} from 'zod'

const CORE_WEB_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  'core.app',
  'test.core.app',
  'ava-labs.github.io' // internal playground
]

/**
 * Core - Browser Extension ids
 * When parsed with URL(...), the browser ID is recognized as "hostname".
 * For example, this:
 *   new URL('chrome-extension://agoakfejjabomempkjlepdflaleeobhb/popup.html#/home')
 * results in:
 *   URL({ hostname: 'agoakfejjabomempkjlepdflaleeobhb', ... })
 */
const CORE_EXT_HOSTNAMES = [
  'agoakfejjabomempkjlepdflaleeobhb', // production build
  'dnoiacbfkodekgkjbpoagaljpbhaedmd' // blue build
]

const CORE_WEB_URLS_REGEX = [
  'https://[a-zA-Z0-9-]+\\.core-web\\.pages\\.dev' // for all https://*.core-web.pages.dev urls
]

export const isCoreMethod = (method: string): boolean =>
  CORE_ONLY_METHODS.includes(method as RpcMethod)

export const isCoreDomain = (url: string): boolean => {
  let hostname = ''
  let protocol = ''

  try {
    const urlObj = new URL(url)
    hostname = urlObj.hostname
    protocol = urlObj.protocol
  } catch (e) {
    return false
  }

  const isCoreExt =
    CORE_EXT_HOSTNAMES.includes(hostname) && protocol === 'chrome-extension:'

  const isCoreWeb =
    CORE_WEB_HOSTNAMES.includes(hostname) ||
    CORE_WEB_URLS_REGEX.some(regex => new RegExp(regex).test(url))

  return isCoreWeb || isCoreExt
}

export const isNetworkSupported = (
  supportedNetworks: Networks,
  chainId: number
): boolean => {
  const network = supportedNetworks[Number(chainId)]
  return Boolean(
    network && [NetworkVMType.EVM, NetworkVMType.PVM].includes(network.vmName)
  )
}

const approveDataSchema = z.object({
  selectedAccounts: z.array(z.string()).nonempty(),
  approvedChainIds: z.array(z.number()).nonempty()
})

export const parseApproveData: (data: unknown) =>
  | SafeParseSuccess<{
      selectedAccounts: ZodArray<ZodString, 'atleastone'>['_output']
      approvedChainIds: ZodArray<ZodNumber, 'atleastone'>['_output']
    }>
  | SafeParseError<{
      selectedAccounts: ZodArray<ZodString, 'atleastone'>['_input']
      approvedChainIds: ZodArray<ZodNumber, 'atleastone'>['_input']
    }> = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
