import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { selectRawNetworks } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { SessionProposal, RpcMethod, CORE_ONLY_METHODS } from '../../types'
import {
  RpcRequestHandler,
  DEFERRED_RESULT,
  HandleResponse,
  ApproveResponse
} from '../types'
import { isCoreDomain, isCoreMethod, parseApproveData } from './utils'

interface OnlyEIP155Namespaces {
  eip155: ProposalTypes.BaseRequiredNamespace
}

function hasOnlyEIP155<T extends ProposalTypes.RequiredNamespaces>(
  requiredNamespaces: T
): requiredNamespaces is T & OnlyEIP155Namespaces {
  const eip155NameSpace = requiredNamespaces.eip155

  return (
    eip155NameSpace !== undefined &&
    Object.keys(requiredNamespaces).length === 1
  )
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

  handle = async (
    request: SessionProposal,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data
    const { proposer, requiredNamespaces } = params

    // make sure only eip155 namespace is requested
    if (!hasOnlyEIP155(requiredNamespaces)) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Only eip155 namespace is supported'
        })
      }
    }

    // make sure we support all the eip155 networks requested
    const eip155NameSpace = requiredNamespaces.eip155
    const supportedNetworks = selectRawNetworks(state)

    if (eip155NameSpace.chains.length === 0) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: `Networks not specified`
        })
      }
    }

    for (const chain of eip155NameSpace.chains) {
      const chainId = chain.split(':')[1] ?? ''
      const network = supportedNetworks[Number(chainId)]

      if (!network || network.vmName !== NetworkVMType.EVM) {
        return {
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: `Requested network ${chain} is not supported`
          })
        }
      }
    }

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

    const chainIds = eip155NameSpace.chains
      ?.map(chain => chain.split(':')[1])
      ?.filter((chainId): chainId is string => !!chainId)
      ?.map(chainId => Number(chainId))

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

    const selectedAccounts = result.data.selectedAccounts
    const namespaces: SessionTypes.Namespaces = {}

    const requiredNamespaces = payload.request.data.params.requiredNamespaces

    const dappUrl = payload.request.data.params.proposer.metadata.url
    const isCoreApp = isCoreDomain(dappUrl)
    const methods = isCoreApp
      ? [...supportedMethods, ...CORE_ONLY_METHODS]
      : supportedMethods

    Object.keys(requiredNamespaces).forEach(key => {
      const accounts: string[] = []
      requiredNamespaces[key]?.chains.forEach(chain => {
        selectedAccounts.forEach(acc => accounts.push(`${chain}:${acc}`))
      })
      namespaces[key] = {
        accounts,
        // returning all methods that we support here to allow dApps
        // that use Wagmi to be able to send/access more rpc methods
        // by default, Wagmi only requests eth_sendTransaction and personal_sign
        methods: methods,
        events: requiredNamespaces[key]?.events ?? []
      }
    })

    return { success: true, value: namespaces }
  }
}
export const sessionRequestHandler = new SessionRequestHandler()
