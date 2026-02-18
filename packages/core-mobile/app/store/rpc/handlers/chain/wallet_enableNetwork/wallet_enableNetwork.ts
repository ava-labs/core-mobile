import { rpcErrors } from '@metamask/rpc-errors'
import { AppListenerEffectAPI } from 'store/types'
import {
  selectAllNetworks,
  selectEnabledChainIds,
  toggleEnabledChainId
} from 'store/network/slice'
import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'

type Params = { chainId: number }

export type WalletEnableNetworkRpcRequest =
  RpcRequest<RpcMethod.WALLET_ENABLE_NETWORK>

class WalletEnableNetworkHandler
  implements RpcRequestHandler<WalletEnableNetworkRpcRequest, number[]>
{
  methods = [RpcMethod.WALLET_ENABLE_NETWORK]

  handle = async (
    request: WalletEnableNetworkRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<number[]> => {
    const params = request.data.params.request.params as Params | undefined
    const chainId = params?.chainId

    if (chainId == null) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Missing parameter: chainId')
      }
    }

    const state = listenerApi.getState()
    const allNetworks = selectAllNetworks(state)
    const network = allNetworks[chainId]

    if (!network) {
      return {
        success: false,
        error: rpcErrors.invalidParams(`Unknown chain id: ${chainId}`)
      }
    }

    const enabledChainIds = selectEnabledChainIds(state)
    if (!enabledChainIds.includes(chainId)) {
      listenerApi.dispatch(toggleEnabledChainId(chainId))
    }

    const updatedEnabledChainIds = selectEnabledChainIds(listenerApi.getState())

    return { success: true, value: updatedEnabledChainIds }
  }
}

export const walletEnableNetworkHandler = new WalletEnableNetworkHandler()
