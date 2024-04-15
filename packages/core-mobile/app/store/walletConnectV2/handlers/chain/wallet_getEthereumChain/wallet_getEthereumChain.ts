import { ethErrors } from 'eth-rpc-errors'
import { AppListenerEffectAPI } from 'store'
import { selectActiveNetwork } from 'store/network'
import { RpcMethod, SessionRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { networkToGetEthChainResponse } from './utils'

export type WalletGetEthereumChainRpcRequest =
  SessionRequest<RpcMethod.WALLET_GET_ETHEREUM_CHAIN>

class WalletGetEthereumChainHandler
  implements RpcRequestHandler<WalletGetEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_GET_ETHEREUM_CHAIN]

  handle = async (
    _: WalletGetEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const activeNetwork = selectActiveNetwork(state)
    if (!activeNetwork) {
      return {
        success: false,
        error: ethErrors.rpc.resourceUnavailable({
          message: 'no active network'
        })
      }
    }
    const response = networkToGetEthChainResponse(activeNetwork)
    return { success: true, value: response }
  }
}

export const walletGetEthereumChainHandler = new WalletGetEthereumChainHandler()
