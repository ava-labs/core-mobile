// TODO: fix addEthereumChain

import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { rpcErrors } from '@metamask/rpc-errors'
import { isValidRPCUrl } from 'services/network/utils/isValidRpcUrl'
import { AppListenerEffectAPI } from 'store/types'
import {
  addCustomNetwork,
  selectActiveNetwork,
  selectAllNetworks,
  setActive
} from 'store/network'
// import * as Navigation from 'utils/Navigation'
// import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletAddEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_ADD_ETHEREUM_CHAIN>

class WalletAddEthereumChainHandler
  implements RpcRequestHandler<WalletAddEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_ADD_ETHEREUM_CHAIN]

  handle = async (
    request: WalletAddEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams('Chain info is invalid')
      }
    }

    const requestedChain = result.data[0]

    const chains = selectAllNetworks(state)
    const currentActiveNetwork = selectActiveNetwork(state)
    const requestedChainId = Number(requestedChain.chainId)

    const isSameNetwork = requestedChainId === currentActiveNetwork?.chainId

    if (isSameNetwork) {
      return {
        success: true,
        value: null
      }
    }

    const rpcUrl = requestedChain.rpcUrls?.[0]
    if (!rpcUrl) {
      return {
        success: false,
        error: rpcErrors.invalidParams('RPC url is missing')
      }
    }

    if (!requestedChain.nativeCurrency) {
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'Expected nativeCurrency param to be defined'
        )
      }
    }

    // use the requested chain's isTestnet value or fall back to the current active network's
    const isTestnet =
      requestedChain.isTestnet !== undefined
        ? requestedChain.isTestnet
        : Boolean(currentActiveNetwork.isTestnet)

    const customNetwork: Network = {
      chainId: requestedChainId,
      chainName: requestedChain.chainName || '',
      description: '',
      explorerUrl: requestedChain.blockExplorerUrls?.[0] || '',
      isTestnet,
      logoUri: requestedChain.iconUrls?.[0] || '',
      mainnetChainId: 0,
      networkToken: {
        symbol: requestedChain.nativeCurrency.symbol,
        name: requestedChain.nativeCurrency.name,
        description: '',
        decimals: requestedChain.nativeCurrency.decimals,
        logoUri: requestedChain.iconUrls?.[0] || ''
      },
      platformChainId: '',
      rpcUrl,
      subnetId: '',
      vmId: '',
      primaryColor: '',
      vmName: NetworkVMType.EVM
    }

    const supportedChainIds = Object.keys(chains ?? {})
    const chainRequestedIsSupported =
      requestedChain && supportedChainIds.includes(requestedChainId.toString())

    if (chainRequestedIsSupported) {
      //   Navigation.navigate({
      //     name: AppNavigation.Root.Wallet,
      //     params: {
      //       screen: AppNavigation.Modal.AddEthereumChainV2,
      //       params: { request, network: customNetwork, isExisting: true }
      //     }
      //   })

      return { success: true, value: DEFERRED_RESULT }
    }

    const isValid = await isValidRPCUrl(
      customNetwork.chainId,
      customNetwork.rpcUrl
    )
    if (!isValid) {
      return {
        success: false,
        error: rpcErrors.invalidParams('ChainID does not match the rpc url')
      }
    }

    // Navigation.navigate({
    //   name: AppNavigation.Root.Wallet,
    //   params: {
    //     screen: AppNavigation.Modal.AddEthereumChainV2,
    //     params: { request, network: customNetwork, isExisting: false }
    //   }
    // })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: WalletAddEthereumChainRpcRequest; data?: unknown },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch, getState } = listenerApi

    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    const data = result.data

    if (!data.isExisting) {
      dispatch(addCustomNetwork(data.network))
    }

    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    // validate network against the current developer mode
    const chainId = data.network.chainId
    const isTestnet = Boolean(data.network?.isTestnet)

    // switch to correct dev mode
    if (isTestnet !== isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }

    dispatch(setActive(chainId))

    return { success: true, value: null }
  }
}

export const walletAddEthereumChainHandler = new WalletAddEthereumChainHandler()
