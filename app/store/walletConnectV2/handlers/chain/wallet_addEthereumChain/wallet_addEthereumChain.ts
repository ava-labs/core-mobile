import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { ethErrors } from 'eth-rpc-errors'
import { isValidRPCUrl } from 'services/network/utils/isValidRpcUrl'
import { AppListenerEffectAPI } from 'store'
import {
  addCustomNetwork,
  selectActiveNetwork,
  selectNetworks,
  setActive
} from 'store/network'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { RpcMethod, SessionRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletAddEthereumChainRpcRequest =
  SessionRequest<RpcMethod.WALLET_ADD_ETHEREUM_CHAIN>

class WalletAddEthereumChainHandler
  implements RpcRequestHandler<WalletAddEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_ADD_ETHEREUM_CHAIN]

  handle = async (
    request: WalletAddEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const store = listenerApi.getState()
    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Chain info is invalid'
        })
      }
    }

    const requestedChain = result.data[0]

    const chains = selectNetworks(store)
    const currentActiveNetwork = selectActiveNetwork(store)
    const supportedChainIds = Object.keys(chains ?? {})
    const requestedChainId = Number(requestedChain.chainId)
    const chainRequestedIsSupported =
      requestedChain && supportedChainIds.includes(requestedChainId.toString())
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
        error: ethErrors.rpc.invalidParams({
          message: 'RPC url is missing'
        })
      }
    }

    if (!requestedChain.nativeCurrency) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Expected nativeCurrency param to be defined'
        })
      }
    }

    const customNetwork: Network = {
      chainId: requestedChainId,
      chainName: requestedChain.chainName || '',
      description: '',
      explorerUrl: requestedChain.blockExplorerUrls?.[0] || '',
      isTestnet: false,
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

    if (chainRequestedIsSupported) {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AddEthereumChainV2,
          params: { request, network: customNetwork, isExisting: true }
        }
      })

      return { success: true, value: DEFERRED_RESULT }
    }

    const isValid = await isValidRPCUrl(
      customNetwork.chainId,
      customNetwork.rpcUrl
    )
    if (!isValid) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'ChainID does not match the rpc url'
        })
      }
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.AddEthereumChainV2,
        params: { request, network: customNetwork, isExisting: false }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: WalletAddEthereumChainRpcRequest; data?: unknown },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi

    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const data = result.data

    if (!data.isExisting) {
      dispatch(addCustomNetwork(data.network))
    }

    dispatch(setActive(data.network.chainId))

    return { success: true, value: null }
  }
}

export const walletAddEthereumChainHandler = new WalletAddEthereumChainHandler()
