import { NetworkVMType } from '@avalabs/core-chains-sdk'
import AppNavigation from 'navigation/AppNavigation'
import { Networks } from 'store/network/types'
import {
  CORE_EVM_METHODS,
  CORE_AVAX_METHODS,
  CORE_BTC_METHODS,
  RpcMethod
} from 'store/rpc/types'
import { SafeParseError, SafeParseSuccess, z, ZodArray } from 'zod'
import * as Navigation from 'utils/Navigation'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import BlockaidService from 'services/blockaid/BlockaidService'
import { SessionProposalV2Params } from 'navigation/types'
import { SiteScanResponse } from 'services/blockaid/types'
import { providerErrors } from '@metamask/rpc-errors'
import { onRequestRejected } from 'store/rpc/slice'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
import { AlertType } from '@avalabs/vm-module-types'
import { ProposalTypes } from '@walletconnect/types'
import {
  isXChainId,
  isCChainId,
  isPChainId,
  isBtcChainId
} from 'utils/caip2ChainIds'

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
  'https://[a-zA-Z0-9-]+\\.core-web\\.pages\\.dev', // for all https://*.core-web.pages.dev urls
  'https://[a-zA-Z0-9-]+\\.redesign-aa3\\.pages\\.dev' // for all https://*.redesign-aa3.pages.dev urls
]

export const isCoreMethod = (method: string): boolean =>
  [...CORE_EVM_METHODS, ...CORE_AVAX_METHODS, ...CORE_BTC_METHODS].includes(
    method as RpcMethod
  )

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
    isBtcChainId(caip2ChainId)
  )
}

export type CoreAccountAddresses = z.infer<typeof coreAccountAddresses>

export const getAddressForChainId = (
  caip2ChainId: string,
  account: CoreAccountAddresses
): string => {
  return isXChainId(caip2ChainId)
    ? account.addressAVM
    : isPChainId(caip2ChainId)
    ? account.addressPVM
    : isBtcChainId(caip2ChainId)
    ? account.addressBTC
    : account.addressC
}

const coreAccountAddresses = z.object({
  addressC: z.string(),
  addressBTC: z.string(),
  addressAVM: z.string(),
  addressPVM: z.string(),
  addressCoreEth: z.string()
})

const namespaceToApproveSchema = z.object({
  chains: z.array(z.string()).optional(),
  methods: z.array(z.string()),
  events: z.array(z.string())
})

export type NamespaceToApprove = z.infer<typeof namespaceToApproveSchema>

const approveDataSchema = z.object({
  selectedAccounts: z.array(coreAccountAddresses).nonempty(),
  namespaces: z.record(namespaceToApproveSchema)
})

export const parseApproveData: (data: unknown) =>
  | SafeParseSuccess<{
      selectedAccounts: ZodArray<
        typeof coreAccountAddresses,
        'atleastone'
      >['_output']
      namespaces: Record<
        string,
        {
          chains?: string[]
          methods: string[]
          events: string[]
        }
      >
    }>
  | SafeParseError<{
      selectedAccounts: ZodArray<
        typeof coreAccountAddresses,
        'atleastone'
      >['_input']
      namespaces: Record<
        string,
        {
          chains?: string[]
          methods: string[]
          events: string[]
        }
      >
    }> = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}

export const scanAndSessionProposal = async ({
  dappUrl,
  request,
  namespaces,
  dispatch
}: {
  dappUrl: string
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
  dispatch: Dispatch<AnyAction>
}): Promise<void> => {
  try {
    const scanResponse = await BlockaidService.scanSite(dappUrl)

    if (isSiteScanResponseMalicious(scanResponse)) {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AlertScreen,
          params: {
            alert: {
              type: AlertType.DANGER,
              details: {
                title: 'Scam\nApplication',
                description: 'This application is malicious, do not proceed.',
                actionTitles: {
                  reject: 'Reject Connection',
                  proceed: 'Proceed Anyway'
                }
              }
            },
            onReject: (): void => {
              dispatch(
                onRequestRejected({
                  request,
                  error: providerErrors.userRejectedRequest()
                })
              )
            },
            onProceed: () => {
              navigateToSessionProposal({
                request,
                namespaces,
                scanResponse
              })
            }
          }
        }
      })
    } else {
      navigateToSessionProposal({ request, namespaces, scanResponse })
    }
  } catch (error) {
    Logger.error('[Blockaid] Failed to scan dApp', error)

    navigateToSessionProposal({ request, namespaces })
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

export const isSiteScanResponseMalicious = (
  scanResponse: SiteScanResponse
): boolean => scanResponse.status === 'hit' && scanResponse.is_malicious
