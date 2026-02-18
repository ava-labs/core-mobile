import { rpcErrors } from '@metamask/rpc-errors'
import { z } from 'zod'
import { AppListenerEffectAPI } from 'store/types'
import {
  selectAllNetworks,
  selectEnabledChainIds,
  toggleEnabledChainId
} from 'store/network/slice'
import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'

const chainIdSchema = z.object({ chainId: z.number() })

// Accept both EIP-1193 tuple form [{ chainId }] (WalletConnect convention)
// and plain object form { chainId } (Core extension convention)
const paramsSchema = z.union([
  z.tuple([chainIdSchema]).transform(([p]) => p),
  chainIdSchema
])

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
    const result = paramsSchema.safeParse(request.data.params.request.params)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Missing parameter: chainId')
      }
    }

    const { chainId } = result.data

    const state = listenerApi.getState()
    const allNetworks = selectAllNetworks(state)
    const network = allNetworks[chainId]

    if (!network) {
      return {
        success: false,
        error: rpcErrors.invalidParams(`Unsupported chain id: ${chainId}`)
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
