import { AnyAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import {
  EthereumProviderError,
  EthereumRpcError,
  ethErrors
} from 'eth-rpc-errors'
import Logger from 'utils/Logger'
import { selectActiveNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import {
  isCoreDomain,
  isCoreMethod
} from 'store/walletConnectV2/handlers/session_request/utils'
import { RpcMethod } from 'store/walletConnectV2'
import {
  onRequest,
  onRequestApproved,
  onRequestRejected,
  onSendRpcError,
  onSendRpcResult
} from '../slice'
import { DappRpcRequest, DEFERRED_RESULT } from '../handlers/types'
import handlerMap from '../handlers'
import { isRequestSupportedOnNetwork } from './utils'

// check if request is either onRequestApproved or onRequestRejected
// and also if the request is the one we are waiting for
const isRequestApprovedOrRejected =
  (requestId: number) => (action: AnyAction) => {
    if (onRequestApproved.match(action) || onRequestRejected.match(action)) {
      return action.payload.request.payload.id === requestId
    }

    return false
  }

export const processRequest = async (
  addRequestAction: ReturnType<typeof onRequest>,
  listenerApi: AppListenerEffectAPI
) => {
  const { dispatch, take } = listenerApi

  const request = addRequestAction.payload
  const method = request.payload.method
  const requestId = request.payload.id
  const handler = handlerMap.get(method)

  Logger.info(`processing request ${requestId}`)

  if (!handler) {
    const errorMsg = `RPC method ${method} not supported`
    Logger.error(errorMsg)

    dispatch(
      onSendRpcError({
        request,
        error: ethErrors.rpc.internal({
          message: errorMsg
        })
      })
    )
    return
  }

  try {
    validateRequest(request, listenerApi)
  } catch (error) {
    Logger.error('rpc request is invalid', error)

    if (
      error instanceof EthereumRpcError ||
      error instanceof EthereumProviderError
    ) {
      dispatch(
        onSendRpcError({
          request,
          error
        })
      )

      return
    }
  }

  const handleResponse = await handler.handle(request, listenerApi)

  if (!handleResponse.success) {
    dispatch(
      onSendRpcError({
        request,
        error: handleResponse.error
      })
    )
    return
  }

  if (handleResponse.value !== DEFERRED_RESULT) {
    dispatch(onSendRpcResult({ request, result: handleResponse.value }))
    return
  }

  // result is DEFERRED_RESULT
  // this means we are displaying a prompt and are waiting for the user to approve
  Logger.info(`asking user for approval for request ${requestId}`)
  const [action] = await take(isRequestApprovedOrRejected(requestId))

  if (onRequestRejected.match(action)) {
    Logger.info(`user rejected request ${requestId}`)
    dispatch(
      onSendRpcError({
        request,
        error: ethErrors.provider.userRejectedRequest()
      })
    )
  } else {
    Logger.info(`user approved request ${requestId}`)
    if (handler.approve) {
      const approveResponse = await handler.approve(
        { ...action.payload },
        listenerApi
      )
      if (!approveResponse.success) {
        dispatch(
          onSendRpcError({
            request,
            error: approveResponse.error
          })
        )
      } else {
        dispatch(onSendRpcResult({ request, result: approveResponse.value }))
      }
    }
  }
}

export const validateRequest = (
  request: DappRpcRequest<string, unknown>,
  listenerApi: AppListenerEffectAPI
) => {
  const { getState } = listenerApi
  const { peerMeta, method } = request.payload
  const activeNetwork = selectActiveNetwork(getState())

  // no need to validate session request yet
  if (method === RpcMethod.SESSION_REQUEST) return

  if (activeNetwork.vmName === NetworkVMType.BITCOIN) {
    Logger.error('bitcoin network is not supported')

    throw ethErrors.rpc.internal({
      message: 'bitcoin network is not supported'
    })
  }

  // only process core methods if they come from core web
  if (isCoreMethod(method)) {
    if (!isCoreDomain(peerMeta?.url || '')) {
      Logger.error(
        `custom core method ${method}. requested by ${peerMeta?.url}`
      )

      throw ethErrors.provider.unauthorized()
    }
  }

  // check if current active network supports such method
  if (!isRequestSupportedOnNetwork(method, activeNetwork)) {
    Logger.error(
      `${method} not supported on the current network ${activeNetwork.vmName}`
    )

    throw ethErrors.rpc.methodNotSupported({
      message: 'Method not supported on the current network'
    })
  }
}
