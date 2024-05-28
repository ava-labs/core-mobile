import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'
import { normalizeNamespaces } from '@walletconnect/utils'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import {
  selectActiveNetwork,
  selectAllNetworks,
  selectFavoriteNetworks
} from 'store/network'
import { selectIsBlockaidDappScanBlocked } from 'store/posthog'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod, CORE_ONLY_METHODS } from '../../types'
import { EVM_IDENTIFIER } from '../../types'
import {
  RpcRequestHandler,
  DEFERRED_RESULT,
  HandleResponse,
  ApproveResponse
} from '../types'
import {
  isCoreDomain,
  isCoreMethod,
  isNetworkSupported,
  navigateToSessionProposal,
  parseApproveData,
  scanAndSessionProposal
} from './utils'

const DEFAULT_EVENTS = ['chainChanged', 'accountsChanged']

interface OnlyEIP155Namespaces {
  [EVM_IDENTIFIER]: ProposalTypes.BaseRequiredNamespace
}

function hasOnlyEIP155<T extends ProposalTypes.RequiredNamespaces>(
  namespaces: T
): namespaces is T & OnlyEIP155Namespaces {
  const eip155NameSpace = namespaces[EVM_IDENTIFIER]

  return eip155NameSpace !== undefined && Object.keys(namespaces).length === 1
}

const supportedMethods = [
  RpcMethod.ETH_SEND_TRANSACTION,
  RpcMethod.SIGN_TYPED_DATA_V3,
  RpcMethod.SIGN_TYPED_DATA_V4,
  RpcMethod.SIGN_TYPED_DATA_V1,
  RpcMethod.SIGN_TYPED_DATA,
  RpcMethod.PERSONAL_SIGN,
  RpcMethod.ETH_SIGN,
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
  RpcMethod.WALLET_GET_ETHEREUM_CHAIN
]

class WCSessionRequestHandler implements RpcRequestHandler<WCSessionProposal> {
  methods = [RpcMethod.WC_SESSION_REQUEST]

  private getApprovedMethods = (dappUrl: string): RpcMethod[] => {
    const isCoreApp = isCoreDomain(dappUrl)

    // approve all methods that we support here to allow dApps
    // that use Wagmi to be able to send/access more rpc methods
    // by default, Wagmi only requests eth_sendTransaction and personal_sign
    return isCoreApp
      ? [...supportedMethods, ...CORE_ONLY_METHODS]
      : supportedMethods
  }

  private getApprovedEvents = (
    requiredNamespaces: ProposalTypes.RequiredNamespaces
  ): string[] => {
    return [
      ...new Set([
        ...DEFAULT_EVENTS,
        ...(requiredNamespaces[EVM_IDENTIFIER]?.events ?? [])
      ])
    ]
  }

  private getApprovedAccounts = (
    selectedAccounts: string[],
    approvedChains: string[]
  ): string[] => {
    const approvedAccounts: string[] = []

    approvedChains.forEach(chain => {
      selectedAccounts.forEach(acc => approvedAccounts.push(`${chain}:${acc}`))
    })

    return approvedAccounts
  }

  private switchToSupportedNetwork = async (
    chainIdsToApprove: number[],
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const state = listenerApi.getState()
    const activeNetwork = selectActiveNetwork(state)
    const supportedNetworks = selectAllNetworks(state)

    if (chainIdsToApprove.includes(activeNetwork.chainId)) {
      // already on one of the requested networks. no need to switch
      return
    }

    const favoritedNetworksChainIds = selectFavoriteNetworks(state).map(
      network => network.chainId
    )
    const supportedChainIds = [
      ...favoritedNetworksChainIds,
      ...Object.values(supportedNetworks)
        .map(network => network.chainId)
        .filter(chainId => !favoritedNetworksChainIds.includes(chainId))
    ]

    const chainIdtoSwitch =
      supportedChainIds.filter(chainId =>
        chainIdsToApprove.includes(chainId)
      )[0] ?? chainIdsToApprove[0]

    if (chainIdtoSwitch === undefined) {
      throw new Error('No supported network found')
    }

    try {
      const request = createInAppRequest(listenerApi.dispatch)
      await request({
        method: RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
        params: [
          {
            chainId: chainIdtoSwitch.toString()
          }
        ]
      })
    } catch (error) {
      throw new Error(`Failed to switch to network ${chainIdtoSwitch}`)
    }
  }

  private getChainIdsToApprove = (
    requiredChains: string[],
    optionalChains: string[],
    listenerApi: AppListenerEffectAPI
  ): number[] => {
    const state = listenerApi.getState()
    const supportedNetworks = selectAllNetworks(state)

    // make sure we support all the required eip155 networks requested
    for (const chain of requiredChains) {
      const chainId = chain.split(':')[1] ?? ''

      if (!isNetworkSupported(supportedNetworks, Number(chainId))) {
        throw new Error(`Requested network ${chain} is not supported`)
      }
    }

    // also add optional chains (if available and only for chains that are supported)
    // to the list of chains to approve
    const supportedOptionalChains = optionalChains.filter(chain => {
      const chainId = chain.split(':')[1] ?? ''
      return isNetworkSupported(supportedNetworks, Number(chainId))
    })

    // list of unique chain IDs to approve
    return [
      ...requiredChains,
      ...supportedOptionalChains.filter(
        chain => !requiredChains.includes(chain)
      )
    ]
      .map(chain => chain.split(':')[1])
      ?.filter((chainId): chainId is string => !!chainId)
      ?.map(chainId => Number(chainId))
  }

  handle = async (
    request: WCSessionProposal,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data
    const { proposer, requiredNamespaces, optionalNamespaces } = params

    const normalizedRequired = normalizeNamespaces(requiredNamespaces)
    const normalizedOptional = normalizeNamespaces(optionalNamespaces)

    try {
      // make sure only eip155 namespace is requested for required namespaces
      if (
        Object.keys(normalizedRequired).length > 0 &&
        !hasOnlyEIP155(normalizedRequired)
      ) {
        throw new Error('Only eip155 namespace is supported')
      }

      // make sure Core methods are only requested by either Core Web, Internal Playground or Localhost
      const dappUrl = proposer.metadata.url
      const hasCoreMethod =
        normalizedRequired[EVM_IDENTIFIER]?.methods.some(isCoreMethod) ?? false

      if (hasCoreMethod && !isCoreDomain(dappUrl)) {
        throw new Error('Requested method is not authorized')
      }

      const requiredChains = normalizedRequired[EVM_IDENTIFIER]?.chains ?? []
      const optionalChains = normalizedOptional[EVM_IDENTIFIER]?.chains ?? []
      const chainIdsToApprove = this.getChainIdsToApprove(
        requiredChains,
        optionalChains,
        listenerApi
      )

      if (chainIdsToApprove.length === 0) {
        throw new Error('Networks not specified')
      }

      await this.switchToSupportedNetwork(chainIdsToApprove, listenerApi)

      const isScanDisabled = selectIsBlockaidDappScanBlocked(state)
      if (isScanDisabled) {
        navigateToSessionProposal({ request, chainIds: chainIdsToApprove })
      } else {
        scanAndSessionProposal(dappUrl, request, chainIdsToApprove)
      }
      return { success: true, value: DEFERRED_RESULT }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: errorMessage
        })
      }
    }
  }

  approve = async (payload: {
    request: WCSessionProposal
    data?: unknown
  }): ApproveResponse => {
    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const requiredNamespaces = payload.request.data.params.requiredNamespaces

    const dappUrl = payload.request.data.params.proposer.metadata.url
    const methods = this.getApprovedMethods(dappUrl)

    const events = this.getApprovedEvents(requiredNamespaces)

    const approvedChainIds = result.data.approvedChainIds
    const chains = approvedChainIds.map(addNamespaceToChain)

    const selectedAccounts = result.data.selectedAccounts
    const accounts = this.getApprovedAccounts(selectedAccounts, chains)

    const namespaces: SessionTypes.Namespaces = {
      [EVM_IDENTIFIER]: {
        chains,
        accounts,
        methods,
        events
      }
    }

    return { success: true, value: namespaces }
  }
}

export const wcSessionRequestHandler = new WCSessionRequestHandler()
