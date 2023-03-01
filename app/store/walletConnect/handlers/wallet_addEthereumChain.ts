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
import { RpcMethod } from 'store/walletConnectV2'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'

interface AddEthereumChainParameter {
  chainId: string
  blockExplorerUrls?: string[]
  chainName?: string
  iconUrls?: string[]
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls?: string[]
}

export type WalletAddEthereumChainRpcRequest = DappRpcRequest<
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  AddEthereumChainParameter[]
>

type ApproveData = {
  network: Network
  isExisting: boolean
}

class WalletAddEthereumChainHandler
  implements RpcRequestHandler<WalletAddEthereumChainRpcRequest, ApproveData>
{
  methods = [RpcMethod.WALLET_ADD_ETHEREUM_CHAIN]

  handle = async (
    request: WalletAddEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const store = listenerApi.getState()

    const requestedChain = request.payload.params?.[0]

    if (!requestedChain) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'missing chain params'
        })
      }
    }

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

    const rpcUrl = requestedChain?.rpcUrls?.[0]
    if (!rpcUrl) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'RPC url missing'
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
      vmName: NetworkVMType.EVM
    }

    if (chainRequestedIsSupported) {
      // navigate with isExisting flag "true" so that the UI can display a "switch to network" prompt
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AddEthereumChain,
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

    // navigate with isExisting flag "false" so that the UI can display a "add new network" prompt
    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.AddEthereumChain,
        params: { request, network: customNetwork, isExisting: false }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: WalletAddEthereumChainRpcRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const data = payload.data

    if (!data.isExisting) {
      dispatch(addCustomNetwork(data.network))
    }

    dispatch(setActive(data.network.chainId))

    return { success: true, value: null }
  }
}

export const walletAddEthereumChainHandler = new WalletAddEthereumChainHandler()
