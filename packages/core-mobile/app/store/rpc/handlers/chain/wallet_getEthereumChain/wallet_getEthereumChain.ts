import { rpcErrors } from '@metamask/rpc-errors'
import { AppListenerEffectAPI } from 'store/types'
import { selectEnabledNetworks } from 'store/network/slice'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { networkToGetEthChainResponse } from './utils'

export type WalletGetEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_GET_ETHEREUM_CHAIN>

class WalletGetEthereumChainHandler
  implements RpcRequestHandler<WalletGetEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_GET_ETHEREUM_CHAIN]

  handle = async (
    _: WalletGetEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const networks = selectEnabledNetworks(state)

    // always return the C-Chain network since we don't have an active network anymore
    const cChainNetwork = networks.find(network =>
      isAvalancheCChainId(network.chainId)
    )

    if (!cChainNetwork) {
      return {
        success: false,
        error: rpcErrors.resourceUnavailable('no C-Chain network')
      }
    }

    const response = networkToGetEthChainResponse(cChainNetwork)

    return { success: true, value: response }
  }
}

export const walletGetEthereumChainHandler = new WalletGetEthereumChainHandler()
