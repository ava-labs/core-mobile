import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { normalizeNamespaces } from '@walletconnect/utils'
import { BlockchainNamespace } from '@avalabs/core-chains-sdk'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import {
  selectActiveNetwork,
  selectAllNetworks,
  selectEnabledNetworks
} from 'store/network/slice'
import { selectIsBlockaidDappScanBlocked } from 'store/posthog/slice'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'
import union from 'lodash/union'
import { RpcMethod, CORE_EVM_METHODS } from '../../types'
import {
  RpcRequestHandler,
  DEFERRED_RESULT,
  HandleResponse,
  ApproveResponse
} from '../types'
import {
  CoreAccountAddresses,
  getAddressForChainId,
  isCoreDomain,
  isCoreMethod,
  isNetworkSupported,
  NamespaceToApprove,
  navigateToSessionProposal,
  parseApproveData,
  scanAndNavigateToSessionProposal
} from './utils'
import { COMMON_EVENTS, NON_EVM_OPTIONAL_NAMESPACES } from './namespaces'

const supportedMethods = [
  RpcMethod.ETH_SEND_TRANSACTION,
  RpcMethod.SIGN_TYPED_DATA_V3,
  RpcMethod.SIGN_TYPED_DATA_V4,
  RpcMethod.SIGN_TYPED_DATA_V1,
  RpcMethod.SIGN_TYPED_DATA,
  RpcMethod.PERSONAL_SIGN,
  RpcMethod.ETH_SIGN,
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  RpcMethod.WALLET_GET_ETHEREUM_CHAIN
]

class WCSessionRequestHandler implements RpcRequestHandler<WCSessionProposal> {
  methods = [RpcMethod.WC_SESSION_REQUEST]

  private getApprovedEvmMethods = (dappUrl: string): RpcMethod[] => {
    const isCoreApp = isCoreDomain(dappUrl)

    // approve all methods that we support here to allow dApps
    // that use Wagmi to be able to send/access more rpc methods
    // by default, Wagmi only requests eth_sendTransaction and personal_sign
    return isCoreApp
      ? [...supportedMethods, ...CORE_EVM_METHODS]
      : supportedMethods
  }

  private getApprovedEvents = (
    requiredNamespaces: ProposalTypes.RequiredNamespaces,
    namespace: string
  ): string[] => {
    return [
      ...new Set([
        ...COMMON_EVENTS,
        ...(requiredNamespaces[namespace]?.events ?? [])
      ])
    ]
  }

  private getApprovedAccounts = (
    selectedAccounts: CoreAccountAddresses[],
    namespace: NamespaceToApprove
  ): string[] => {
    const approvedAccounts: string[] = []

    const chains = namespace.chains ?? []
    chains.forEach(chain => {
      selectedAccounts.forEach(acc => {
        const address = getAddressForChainId(chain, acc)

        approvedAccounts.push(`${chain}:${address}`)
      })
    })

    return approvedAccounts
  }

  private switchToSupportedNetwork = async (
    caip2ChainIdsToApprove: string[],
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const state = listenerApi.getState()
    const activeNetwork = selectActiveNetwork(state)
    const supportedNetworks = selectAllNetworks(state)
    const chainIdsToApprove = caip2ChainIdsToApprove.map(getChainIdFromCaip2)

    if (chainIdsToApprove.includes(activeNetwork.chainId)) {
      // already on one of the requested networks. no need to switch
      return
    }

    const enabledNetworksChainIds = selectEnabledNetworks(state).map(
      network => network.chainId
    )
    const supportedChainIds = [
      ...enabledNetworksChainIds,
      ...Object.values(supportedNetworks)
        .map(network => network.chainId)
        .filter(chainId => !enabledNetworksChainIds.includes(chainId))
    ]

    const chainIdtoSwitch =
      supportedChainIds.filter(chainId =>
        chainIdsToApprove.includes(chainId)
      )[0] ?? chainIdsToApprove[0]

    if (chainIdtoSwitch === undefined) {
      throw new Error('No supported network found')
    }

    // try {
    //   const chainId = chainIdtoSwitch.toString()
    //   const request = createInAppRequest(listenerApi.dispatch)
    //   await request({
    //     method:
    //       RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN as unknown as VmModuleRpcMethod,
    //     params: [
    //       {
    //         chainId
    //       }
    //     ],
    //     chainId: `${BlockchainNamespace.EIP155}:${chainId}`
    //   })
    // } catch (error) {
    //   throw new Error(`Failed to switch to network ${chainIdtoSwitch}`)
    // }
  }

  private getNamespacesToApprove = (
    requiredNamespaces: ProposalTypes.RequiredNamespaces,
    optionalNamespaces: ProposalTypes.OptionalNamespaces,
    listenerApi: AppListenerEffectAPI
  ): {
    [namespace: string]: ProposalTypes.BaseRequiredNamespace
  } => {
    const state = listenerApi.getState()
    const supportedNetworks = selectAllNetworks(state)

    // make sure we support all the required networks requested
    for (const chain of Object.values(requiredNamespaces).flatMap(
      namespace => namespace.chains ?? []
    )) {
      if (!isNetworkSupported(supportedNetworks, chain)) {
        throw new Error(`Requested network ${chain} is not supported`)
      }
    }

    // also filter optional chains (if available and only for chains that are supported)
    const optionalSupportedNamespaces: ProposalTypes.OptionalNamespaces = {}
    for (const namespace of Object.keys(optionalNamespaces)) {
      const optionalNamespace = optionalNamespaces[namespace]
      if (optionalNamespace) {
        const supportedOptionalChains = optionalNamespace.chains?.filter(
          chain => isNetworkSupported(supportedNetworks, chain)
        )

        if (supportedOptionalChains && supportedOptionalChains.length > 0) {
          optionalSupportedNamespaces[namespace] = {
            ...optionalNamespace,
            chains: supportedOptionalChains
          }
        }
      }
    }

    return mergeWith(
      {},
      requiredNamespaces,
      optionalSupportedNamespaces,
      (objValue: unknown, srcValue: unknown): unknown => {
        if (isArray(objValue) && isArray(srcValue)) {
          return union(objValue, srcValue)
        }

        return undefined
      }
    )
  }

  handle = async (
    request: WCSessionProposal,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data
    const { proposer, requiredNamespaces, optionalNamespaces } = params
    const dappUrl = proposer.metadata.url
    const isCoreApp = isCoreDomain(dappUrl)

    const normalizedRequired = normalizeNamespaces(requiredNamespaces)
    const normalizedOptional = normalizeNamespaces(
      // add optional namespaces for non-evm chains support
      // since core web integrated wagmi and it only supports EVM for now,
      // it throws an error when we add these non-EVM namespaces in the dapp.
      // This is a temporary fix until core web supports these namespaces
      isCoreApp
        ? {
            ...optionalNamespaces,
            ...NON_EVM_OPTIONAL_NAMESPACES
          }
        : optionalNamespaces
    )

    try {
      // make sure Core methods are only requested by either Core Web, Internal Playground or Localhost

      const hasCoreMethod =
        normalizedRequired[BlockchainNamespace.EIP155]?.methods.some(
          isCoreMethod
        ) ?? false

      if (hasCoreMethod && !isCoreApp) {
        throw new Error('Requested method is not authorized')
      }

      const namespaces = this.getNamespacesToApprove(
        normalizedRequired,
        normalizedOptional,
        listenerApi
      )

      const chainsToApprove = Object.values(namespaces).flatMap(
        namespace => namespace.chains ?? []
      )
      if (chainsToApprove.length === 0) {
        throw new Error('Networks not specified')
      }

      await this.switchToSupportedNetwork(chainsToApprove, listenerApi)

      const isScanDisabled = selectIsBlockaidDappScanBlocked(state)
      if (isScanDisabled) {
        navigateToSessionProposal({ request, namespaces })
      } else {
        scanAndNavigateToSessionProposal({
          dappUrl,
          request,
          namespaces
        })
      }
      return { success: true, value: DEFERRED_RESULT }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: rpcErrors.invalidParams(errorMessage)
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
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    const requiredNamespaces = payload.request.data.params.requiredNamespaces

    const dappUrl = payload.request.data.params.proposer.metadata.url

    const namespacesToApprove = result.data.namespaces

    const selectedAccounts = result.data.selectedAccounts

    const namespaces: SessionTypes.Namespaces = {}
    for (const namespace of Object.keys(namespacesToApprove)) {
      const namespaceToApprove = namespacesToApprove[namespace]
      if (namespaceToApprove) {
        const accounts = this.getApprovedAccounts(
          selectedAccounts,
          namespaceToApprove
        )

        const methods =
          namespace === BlockchainNamespace.EIP155
            ? this.getApprovedEvmMethods(dappUrl)
            : namespaceToApprove.methods

        const events = this.getApprovedEvents(requiredNamespaces, namespace)

        if (namespace === BlockchainNamespace.EIP155) {
          // Validate that all required methods are included
          const requiredMethods = requiredNamespaces[namespace]?.methods || []
          const missingMethods = requiredMethods.filter(
            method => !methods.includes(method)
          )

          if (missingMethods.length > 0) {
            // Add missing methods to prevent namespace conformity error
            methods.push(...missingMethods)
          }
        }

        namespaces[namespace] = {
          chains: namespaceToApprove.chains,
          accounts,
          methods,
          events
        }
      }
    }

    return { success: true, value: namespaces }
  }
}

export const wcSessionRequestHandler = new WCSessionRequestHandler()
