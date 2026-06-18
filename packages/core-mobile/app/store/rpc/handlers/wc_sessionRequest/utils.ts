import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network/types'
import {
  CORE_EVM_METHODS,
  CORE_AVAX_METHODS,
  CORE_BTC_METHODS,
  RpcMethod,
  CORE_WALLET_METHODS
} from 'store/rpc/types'
import { z } from 'zod'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import BlockaidService from 'services/blockaid/BlockaidService'
import { SiteScanResponse } from 'services/blockaid/types'
import { ProposalTypes } from '@walletconnect/types'
import {
  isXChainId,
  isCChainId,
  isPChainId,
  isBtcChainId,
  isSvmChainId
} from 'utils/caip2ChainIds'
import { router } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { SessionProposalV2Params } from '../types'

const CORE_WEB_HOSTNAMES = [
  'core.app',
  'staging.core.app',
  'develop.core.app',
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

const CORE_WEB_HOSTNAMES_REGEX = [
  // core web preview deploys (ex. d0ce77c0-core-web-dev.avalabs.workers.dev)
  /^[a-zA-Z0-9]+-core-web-dev\.avalabs\.workers\.dev$/
]

export const isCoreMethod = (method: string): boolean =>
  [
    ...CORE_EVM_METHODS,
    ...CORE_AVAX_METHODS,
    ...CORE_BTC_METHODS,
    ...CORE_WALLET_METHODS
  ].includes(method as RpcMethod)

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

  const isLocalhost =
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    (protocol === 'http:' || protocol === 'https:')

  const isCoreWeb =
    isLocalhost ||
    (protocol === 'https:' && CORE_WEB_HOSTNAMES.includes(hostname)) ||
    (protocol === 'https:' &&
      CORE_WEB_HOSTNAMES_REGEX.some(regex => regex.test(hostname)))

  return isCoreWeb || isCoreExt
}

export type VerifyContext = WCSessionProposal['data']['verifyContext']

export const isVerifiedCoreDomain = (
  verifyContext: VerifyContext | undefined
): boolean => {
  if (!verifyContext) return false

  const { validation, origin } = verifyContext.verified

  try {
    const urlObj = new URL(origin)
    if (urlObj.protocol === 'chrome-extension:') {
      // INVALID means the browser's actual origin didn't match the claimed chrome-extension URL.
      // UNKNOWN is expected for the real Core Extension (chrome-extension:// can't host the WC verify frame).
      return validation !== 'INVALID' && CORE_EXT_HOSTNAMES.includes(urlObj.hostname)
    }
  } catch {
    return false
  }

  // UNKNOWN = domain not registered with WC Verify (or Verify API unavailable).
  // INVALID = origin does not match registered domain — likely spoofed.
  if (validation !== 'VALID') {
    return false
  }

  return isCoreDomain(origin)
}

export const isNetworkSupported = (
  supportedNetworks: Networks,
  caip2ChainId: string
): boolean => {
  const chainId = caip2ChainId.split(':')[1] ?? ''
  const network = supportedNetworks[Number(chainId)]
  if (network) {
    return [NetworkVMType.EVM].includes(network.vmName)
  }

  return (
    isXChainId(caip2ChainId) ||
    isPChainId(caip2ChainId) ||
    isCChainId(caip2ChainId) ||
    isBtcChainId(caip2ChainId) ||
    isSvmChainId(caip2ChainId)
  )
}

export type CoreAccountAddresses = z.infer<typeof coreAccountAddresses>

export const getAddressForChainId = (
  caip2ChainId: string,
  account: CoreAccountAddresses
): string | undefined => {
  return isXChainId(caip2ChainId)
    ? account.addressAVM
    : isPChainId(caip2ChainId)
    ? account.addressPVM
    : isBtcChainId(caip2ChainId)
    ? account.addressBTC
    : isSvmChainId(caip2ChainId)
    ? account.addressSVM
    : account.addressC
}

const coreAccountAddresses = z.object({
  addressC: z.string(),
  addressBTC: z.string(),
  addressAVM: z.string().optional(),
  addressPVM: z.string().optional(),
  addressCoreEth: z.string(),
  addressSVM: z.string().optional()
})

const namespaceToApproveSchema = z.object({
  chains: z.array(z.string()).optional(),
  methods: z.array(z.string()),
  events: z.array(z.string())
})

export type NamespaceToApprove = z.infer<typeof namespaceToApproveSchema>

const approveDataSchema = z.object({
  selectedAccounts: z.array(coreAccountAddresses).nonempty(),
  namespaces: z.record(z.string(), namespaceToApproveSchema)
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}

export const scanAndNavigateToSessionProposal = async ({
  dappUrl,
  request,
  namespaces
}: {
  dappUrl: string
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
}): Promise<void> => {
  try {
    const scanResponse = await BlockaidService.scanSite(dappUrl)
    navigateToSessionProposal({ request, namespaces, scanResponse })
  } catch (error) {
    Logger.error('[Blockaid] Failed to scan dApp', error)
    navigateToSessionProposal({ request, namespaces, scanFailed: true })
  }
}

export const navigateToSessionProposal = (
  params: SessionProposalV2Params
): void => {
  walletConnectCache.sessionProposalParams.set(params)
  router.navigate('/authorizeDapp')
}

export const isSiteScanResponseMalicious = (
  scanResponse: SiteScanResponse
): boolean => scanResponse.status === 'hit' && scanResponse.is_malicious
