import { AppListenerEffectAPI } from 'store/index'
import { EthereumRpcError, ethErrors } from 'eth-rpc-errors'
import { AnyAction } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import { selectActiveNetwork } from 'store/network'
import { Network } from '@avalabs/chains-sdk'
import {
  onRequestApproved,
  onSendRpcResult,
  onSessionRequest,
  onCallRequest,
  onSendRpcError
} from '../slice'
import handlerMap from '../handlers'
import { TypedJsonRpcRequest } from '../handlers/types'
import {
  isCoreMethod,
  isFromCoreWeb,
  isRequestSupportedOnNetwork
} from './utils'

export const validateRequest = ({
  action,
  activeNetwork
}: {
  action: {
    payload: TypedJsonRpcRequest<string, unknown>
    type: string
  }
  activeNetwork: Network
}) => {
  // no need to validate session request yet
  if (onSessionRequest.match(action)) return

  const { peerMeta, method } = action.payload

  // only process core methods if they come from core web
  if (isCoreMethod(method)) {
    if (!isFromCoreWeb(peerMeta?.url || '')) {
      Logger.warn(
        `ignoring custom core method ${method}. requested by ${peerMeta?.url}`
      )

      throw ethErrors.provider.unauthorized()
    }
  }

  // check if current active network supports such method
  if (!isRequestSupportedOnNetwork(method, activeNetwork)) {
    throw ethErrors.rpc.methodNotSupported({
      message: 'Method not supported on the current network'
    })
  }
}

export const handleRequest = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
) => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const activeNetwork = selectActiveNetwork(state)

  if (!onSessionRequest.match(action) && !onCallRequest.match(action)) return

  const request = action.payload
  const { method } = request
  const handler = handlerMap.get(method)

  if (!handler) {
    dispatch(
      onSendRpcError({
        request: {
          payload: request
        },
        error: ethErrors.rpc.internal({
          message: `RPC method ${method} not supported`
        })
      })
    )
    return
  }

  try {
    validateRequest({ action, activeNetwork })
    handler.handle(action, listenerApi)
  } catch (error) {
    if (error instanceof EthereumRpcError) {
      Logger.error('rpc request is invalid', error)
      dispatch(
        onSendRpcError({
          request: {
            payload: request
          },
          error
        })
      )
    } else {
      Logger.error('failed to handle rpc request', error)
    }
  }
}

export const approveRequest = async (
  action: ReturnType<typeof onRequestApproved>,
  listenerApi: AppListenerEffectAPI
) => {
  const handler = handlerMap.get(action.payload.request.payload.method)

  if (handler) {
    // call approve() method if the handler implements it
    if (handler.approve) {
      handler.approve(action, listenerApi)
    } else {
      // otherwise we are good to send the result
      listenerApi.dispatch(
        onSendRpcResult({
          request: action.payload.request
        })
      )
    }
  }
}
