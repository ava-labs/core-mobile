import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { selectActiveNetwork, selectRawNetworks } from 'store/network'
import { EVM_IDENTIFIER } from 'consts/walletConnect'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'
import { normalizeNamespaces } from '@walletconnect/utils'
import { SessionProposal, RpcMethod, CORE_ONLY_METHODS } from '../../types'
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
  parseApproveData
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
  RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN
]

class SessionRequestHandler implements RpcRequestHandler<SessionProposal> {
  methods = [RpcMethod.SESSION_REQUEST]

  private getApprovedMethods = (dappUrl: string) => {
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
  ) => {
    return [
      ...new Set([
        ...DEFAULT_EVENTS,
        ...(requiredNamespaces[EVM_IDENTIFIER]?.events ?? [])
      ])
    ]
  }

  private getApprovedChainIds = (approvedChains: number[]) => {
    return approvedChains
  }

  private getApprovedAccounts = (
    selectedAccounts: string[],
    approvedChains: string[]
  ) => {
    const approvedAccounts: string[] = []

    approvedChains.forEach(chain => {
      selectedAccounts.forEach(acc => approvedAccounts.push(`${chain}:${acc}`))
    })

    return approvedAccounts
  }

  handle = async (
    request: SessionProposal,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data
    const { proposer, requiredNamespaces, optionalNamespaces } = params

    let normalizedRequired = normalizeNamespaces(requiredNamespaces)
    const normalizedOptional = normalizeNamespaces(optionalNamespaces)

    if (Object.keys(normalizedRequired).length === 0) {
      const { chainId } = selectActiveNetwork(state)
      normalizedRequired = {
        [EVM_IDENTIFIER]: {
          chains: [addNamespaceToChain(chainId)],
          methods: [],
          events: []
        }
      }
    }

    // make sure only eip155 namespace is requested
    if (!hasOnlyEIP155(normalizedRequired)) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Only eip155 namespace is supported'
        })
      }
    }

    const eip155NameSpace = normalizedRequired[EVM_IDENTIFIER]
    const supportedNetworks = selectRawNetworks(state)

    const requiredChains = eip155NameSpace.chains

    if (requiredChains === undefined || requiredChains.length === 0) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: `Networks not specified`
        })
      }
    }

    // make sure we support all the required eip155 networks requested
    for (const chain of requiredChains) {
      const chainId = chain.split(':')[1] ?? ''

      if (!isNetworkSupported(supportedNetworks, Number(chainId))) {
        return {
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: `Requested network ${chain} is not supported`
          })
        }
      }
    }

    // also add optional chains (if available and only for chains that are supported)
    // to the list of chains to approve
    const optionalChains = (
      normalizedOptional[EVM_IDENTIFIER]?.chains ?? []
    ).filter(chain => {
      const chainId = chain.split(':')[1] ?? ''
      return isNetworkSupported(supportedNetworks, Number(chainId))
    })

    // list of chain IDs to approve
    const chainIds = [...requiredChains, ...optionalChains]
      ?.map(chain => chain.split(':')[1])
      ?.filter((chainId): chainId is string => !!chainId)
      ?.map(chainId => Number(chainId))

    // make sure Core methods are only requested by either Core Web, Internal Playground or Localhost
    const dappUrl = proposer.metadata.url
    const hasCoreMethod = eip155NameSpace.methods.some(isCoreMethod)

    if (hasCoreMethod && !isCoreDomain(dappUrl)) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: `Requested method is not authorized`
        })
      }
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SessionProposalV2,
        params: { request, chainIds }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (payload: {
    request: SessionProposal
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
    const chains =
      this.getApprovedChainIds(approvedChainIds).map(addNamespaceToChain)

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

export const sessionRequestHandler = new SessionRequestHandler()
