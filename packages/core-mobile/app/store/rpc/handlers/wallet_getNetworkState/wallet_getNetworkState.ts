import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import Logger from 'utils/Logger'
import { selectEnabledNetworksByTestnet } from 'store/network/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { selectTokenVisibility } from 'store/portfolio/slice'
import { selectActiveAccount } from 'store/account'
import { HandleResponse, RpcRequestHandler } from '../types'
import { parseRequestParams } from './utils'
import { getTokensByNetworkFromCache } from './getTokensByNetworkFromCache'

type Network = {
  caip2ChainId: string
  rpcUrl: string
  name: string
  logoUrl?: string
  explorerUrl?: string
  networkToken: {
    name: string
    symbol: string
    decimals: number
  }
  enabledTokens: string[]
  disabledTokens: string[]
}

type NetworkStateResponse = {
  networks: Network[]
}

export type WalletGetNetworkStateRpcRequest =
  RpcRequest<RpcMethod.WALLET_GET_NETWORK_STATE>

class WalletGetNetworkStateHandler
  implements
    RpcRequestHandler<WalletGetNetworkStateRpcRequest, NetworkStateResponse>
{
  methods = [RpcMethod.WALLET_GET_NETWORK_STATE]

  handle = async (
    request: WalletGetNetworkStateRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<NetworkStateResponse> => {
    const { getState } = listenerApi
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(getState())

    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      Logger.error('Invalid param', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'wallet_getNetworkState param is invalid'
        )
      }
    }
    const isTestnet = result.data[0]

    if (isDeveloperMode !== isTestnet) {
      Logger.error(
        'wallet_getNetworkState isTestnet does not match wallet isDeveloperMode',
        { isTestnet, isDeveloperMode }
      )
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'wallet_getNetworkState isTestnet does not match wallet isDeveloperMode'
        )
      }
    }

    const enabledNetworks = selectEnabledNetworksByTestnet(isTestnet)(state)
    const tokenVisibility = selectTokenVisibility(state)

    const activeAccount = selectActiveAccount(state)

    const networks = enabledNetworks.map(network => {
      const { enabledTokens, disabledTokens } = getTokensByNetworkFromCache({
        account: activeAccount,
        network,
        tokenVisibility
      })

      return {
        caip2ChainId: getCaip2ChainId(network.chainId),
        rpcUrl: network.rpcUrl,
        name: network.chainName,
        logoUrl: network.logoUri,
        explorerUrl: network.explorerUrl,
        networkToken: {
          name: network.networkToken.name,
          symbol: network.networkToken.symbol,
          decimals: network.networkToken.decimals
        },
        enabledTokens,
        disabledTokens
      }
    })

    return { success: true, value: { networks } }
  }
}

export const walletGetNetworkStateHandler = new WalletGetNetworkStateHandler()
