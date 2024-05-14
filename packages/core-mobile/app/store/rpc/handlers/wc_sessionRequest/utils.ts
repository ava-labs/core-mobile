import { NetworkVMType } from '@avalabs/chains-sdk'
import AppNavigation from 'navigation/AppNavigation'
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
import * as Navigation from 'utils/Navigation'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import BlockaidService from 'services/blockaid/BlockaidService'
import { SessionProposalV2Params } from 'navigation/types'

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
  return Boolean(network && [NetworkVMType.EVM].includes(network.vmName))
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

export const scanAndSessionProposal = async (
  dappUrl: string,
  request: WCSessionProposal,
  chainIds: number[]
): Promise<void> => {
  try {
    const scanResponse = await BlockaidService.scanSite(dappUrl)

    if (scanResponse.status === 'hit' && scanResponse.is_malicious) {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.MaliciousActivityWarning,
          params: {
            activityType: 'SessionProposal',
            request,
            onProceed: () => {
              navigateToSessionProposal({ request, chainIds, scanResponse })
            }
          }
        }
      })
    } else {
      navigateToSessionProposal({ request, chainIds, scanResponse })
    }
  } catch (error) {
    Logger.error('[Blockaid]Failed to validate transaction', error)

    navigateToSessionProposal({ request, chainIds })
  }
}

export const navigateToSessionProposal = (
  params: SessionProposalV2Params
): void => {
  Navigation.navigate({
    name: AppNavigation.Root.Wallet,
    params: {
      screen: AppNavigation.Modal.SessionProposalV2,
      params
    }
  })
}
