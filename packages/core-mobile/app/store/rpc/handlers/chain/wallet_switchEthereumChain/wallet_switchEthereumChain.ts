import { rpcErrors } from '@metamask/rpc-errors'
import { router } from 'expo-router'
import { selectAllNetworks } from 'store/network/slice'
import { AppListenerEffectAPI } from 'store/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { RpcMethod, RpcProvider, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'

export type WalletSwitchEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN>

const parseRequestedChainId = (params: unknown): number | undefined => {
  if (!Array.isArray(params)) return undefined
  const hexChainId = (params[0] as { chainId?: unknown } | undefined)?.chainId
  if (typeof hexChainId !== 'string') return undefined
  const chainId = parseInt(hexChainId, 16)
  return isNaN(chainId) ? undefined : chainId
}

class WalletSwitchEthereumChainHandler
  implements RpcRequestHandler<WalletSwitchEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN]

  handle = async (
    request: WalletSwitchEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    // WalletConnect: requests carry their own chainId (multi-chain session), so
    // there is no persistent chain to switch — keep returning success so dApps
    // don't get a method-not-supported error.
    if (request.provider !== RpcProvider.CORE_MOBILE) {
      return { success: true, value: null }
    }

    // In-app browser: the injected provider switches the tab's chain only after
    // the user confirms here (WSR-PERM-009). The router has already rejected
    // unknown chains (4902) and no-op'd a switch to the active chain.
    const chainId = parseRequestedChainId(request.data.params.request.params)
    if (chainId === undefined) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid chainId')
      }
    }

    const network = selectAllNetworks(listenerApi.getState())[chainId]
    if (!network) {
      return {
        success: false,
        error: rpcErrors.invalidParams(
          `Chain ${chainId} has not been added to your wallet.`
        )
      }
    }

    walletConnectCache.switchEthereumChainParams.set({ request, network })
    router.navigate('/switchEthereumChain')
    return { success: true, value: DEFERRED_RESULT }
  }

  // The switch itself is applied by the injected provider once this resolves.
  approve = async (): ApproveResponse => ({ success: true, value: null })
}

export const walletSwitchEthereumChainHandler =
  new WalletSwitchEthereumChainHandler()
