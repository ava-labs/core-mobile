import { Network } from '@avalabs/chains-sdk'
import { ethErrors } from 'eth-rpc-errors'
import { AppListenerEffectAPI } from 'store'
import { selectActiveNetwork, selectNetworks, setActive } from 'store/network'
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

export type WalletSwitchEthereumChainRpcRequest = DappRpcRequest<
  RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
  { chainId: string }[]
>

type ApproveData = {
  network: Network
}

class WalletSwitchEthereumChainHandler
  implements
    RpcRequestHandler<WalletSwitchEthereumChainRpcRequest, ApproveData>
{
  methods = [RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN]

  handle = async (
    request: WalletSwitchEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const store = listenerApi.getState()

    const params = request.payload.params
    const targetChainID = params?.[0]?.chainId // chain ID is hex with 0x prefix
    const networks = selectNetworks(store)
    const supportedNetwork = networks[Number(targetChainID)]
    const currentActiveNetwork = selectActiveNetwork(store)

    // Verify if the wallet is not currently on the requested network.
    // If it is, we just need to return early to prevent an unnecessary UX
    if (Number(targetChainID) === currentActiveNetwork?.chainId) {
      return { success: true, value: null }
    }
    // If the network is not currently on the requested network and we currently support the network
    // then we need to show a confirmation popup to confirm user wants to switch to the requested network
    // from the dApp they are on.
    if (supportedNetwork?.chainId) {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SwitchEthereumChain,
          params: { request, network: supportedNetwork }
        }
      })

      return { success: true, value: DEFERRED_RESULT }
    } else {
      return {
        success: false,
        error: ethErrors.provider.custom({
          code: 4902, // To-be-standardized "unrecognized chain ID" error
          message: `Unrecognized chain ID "${targetChainID}". Try adding the chain using ${RpcMethod.WALLET_ADD_ETHEREUM_CHAIN} first.`
        })
      }
    }
  }

  approve = async (
    payload: {
      request: WalletSwitchEthereumChainRpcRequest
      data: ApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const data = payload.data

    dispatch(setActive(data.network.chainId))

    return { success: true, value: null }
  }
}

export const walletSwitchEthereumChainHandler =
  new WalletSwitchEthereumChainHandler()
