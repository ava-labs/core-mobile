import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod, SessionRequest } from 'store/walletConnectV2'
import { toggleDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'
import { HandleResponse, RpcRequestHandler } from '../types'
import { parseRequestParams } from './utils'

export type AvalancheSetDeveloperModeRpcRequest =
  SessionRequest<RpcMethod.AVALANCHE_SET_DEVELOPER_MODE>

class AvalancheSetDeveloperModeHandler
  implements RpcRequestHandler<AvalancheSetDeveloperModeRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_SET_DEVELOPER_MODE]

  handle = async (
    request: AvalancheSetDeveloperModeRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { dispatch, getState } = listenerApi
    const isDeveloperMode = getState().settings.advanced.developerMode
    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'avalanche_setDeveloperMode param is invalid'
        })
      }
    }
    const enableDeveloperMode = result.data[0]
    isDeveloperMode !== enableDeveloperMode && dispatch(toggleDeveloperMode())
    return {
      success: true,
      value: `Developer Mode set to ${enableDeveloperMode}`
    }
  }
}

export const avalancheSetDeveloperModeHandler =
  new AvalancheSetDeveloperModeHandler()
