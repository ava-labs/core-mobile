import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'

export type WalletSwitchEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN>

// TODO: investigate if we still need to implement this handler to switch to the requested network given that we support multi-chain
// for now, we just return a success response so that we don't throw method not supported error
class WalletSwitchEthereumChainHandler
  implements RpcRequestHandler<WalletSwitchEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN]

  handle = async (_: WalletSwitchEthereumChainRpcRequest): HandleResponse => {
    return { success: true, value: null }
  }
}

export const walletSwitchEthereumChainHandler =
  new WalletSwitchEthereumChainHandler()
