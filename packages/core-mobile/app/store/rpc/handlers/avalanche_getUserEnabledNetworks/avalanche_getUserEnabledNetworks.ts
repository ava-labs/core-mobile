import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import Logger from 'utils/Logger'
import { selectEnabledNetworksByTestnet } from 'store/network/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { HandleResponse, RpcRequestHandler } from '../types'
import { parseRequestParams } from './utils'

export type AvalancheGetUserEnabledNetworksRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_USER_ENABLED_NETWORKS>

class AvalancheGetUserEnabledNetworksHandler
  implements
    RpcRequestHandler<AvalancheGetUserEnabledNetworksRpcRequest, string[]>
{
  methods = [RpcMethod.AVALANCHE_GET_USER_ENABLED_NETWORKS]

  handle = async (
    request: AvalancheGetUserEnabledNetworksRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<string[]> => {
    const { getState } = listenerApi
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(getState())

    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      Logger.error('Invalid param', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'avalanche_getUserEnabledNetworks param is invalid'
        )
      }
    }
    const isTestnet = result.data[0]

    if (isDeveloperMode !== isTestnet) {
      Logger.error(
        'avalanche_getUserEnabledNetworks isTestnet does not match wallet isDeveloperMode',
        { isTestnet, isDeveloperMode }
      )
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'avalanche_getUserEnabledNetworks isTestnet does not match wallet isDeveloperMode'
        )
      }
    }

    const enabledNetworks = selectEnabledNetworksByTestnet(isTestnet)(state)

    return { success: true, value: enabledNetworks }
  }
}

export const avalancheGetUserEnabledNetworksHandler =
  new AvalancheGetUserEnabledNetworksHandler()
