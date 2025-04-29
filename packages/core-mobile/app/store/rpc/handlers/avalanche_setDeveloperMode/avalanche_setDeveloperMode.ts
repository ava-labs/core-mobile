import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod } from 'store/rpc/types'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import Logger from 'utils/Logger'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseRequestParams } from './utils'
import {
  AvalancheSetDeveloperModeApproveData,
  AvalancheSetDeveloperModeRpcRequest
} from './types'

class AvalancheSetDeveloperModeHandler
  implements
    RpcRequestHandler<
      AvalancheSetDeveloperModeRpcRequest,
      null,
      string,
      AvalancheSetDeveloperModeApproveData
    >
{
  methods = [RpcMethod.AVALANCHE_SET_DEVELOPER_MODE]

  handle = async (
    request: AvalancheSetDeveloperModeRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<null> => {
    const { getState } = listenerApi
    const result = parseRequestParams(request.data.params.request.params)
    const isDeveloperMode = selectIsDeveloperMode(getState())

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'avalanche_setDeveloperMode param is invalid'
        )
      }
    }
    const enabled = result.data[0]
    if (isDeveloperMode === enabled) {
      return {
        success: true,
        value: null
      }
    }

    // const data: AvalancheSetDeveloperModeApproveData = {
    //   enabled
    // }

    // TODO: reenable this rpc handler
    // Navigation.navigate({
    //   name: AppNavigation.Root.Wallet,
    //   params: {
    //     screen: AppNavigation.Modal.AvalancheSetDeveloperMode,
    //     params: { request, data }
    //   }
    // })
    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: AvalancheSetDeveloperModeRpcRequest
      data: AvalancheSetDeveloperModeApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse<string> => {
    const { dispatch } = listenerApi

    const enableDeveloperMode = payload.data.enabled

    dispatch(toggleDeveloperMode())
    return {
      success: true,
      value: `Developer Mode set to ${enableDeveloperMode}`
    }
  }
}

export const avalancheSetDeveloperModeHandler =
  new AvalancheSetDeveloperModeHandler()
