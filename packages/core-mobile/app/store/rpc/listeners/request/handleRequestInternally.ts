import { AnyAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { DEFERRED_RESULT, RpcRequestHandler } from '../../handlers/types'
import { AgnosticRpcProvider, Request } from '../../types'
import { onRequestApproved, onRequestRejected } from '../../slice'

// check if request is either onRequestApproved or onRequestRejected
// and also if the request is the one we are waiting for
const isRequestApprovedOrRejected =
  (requestId: number) => (action: AnyAction) => {
    if (onRequestApproved.match(action) || onRequestRejected.match(action)) {
      return action.payload.request.data.id === requestId
    }

    return false
  }

export const handleRequestInternally = async ({
  rpcProvider,
  request,
  handler,
  listenerApi
}: {
  rpcProvider: AgnosticRpcProvider
  request: Request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: RpcRequestHandler<any, any, any, any>
  listenerApi: AppListenerEffectAPI
}): Promise<void> => {
  const { take } = listenerApi
  const handleResponse = await handler.handle(request, listenerApi)

  if (!handleResponse.success) {
    rpcProvider.onError({
      request,
      error: handleResponse.error,
      listenerApi
    })
    return
  }

  if (handleResponse.value !== DEFERRED_RESULT) {
    rpcProvider.onSuccess({
      request,
      result: handleResponse.value,
      listenerApi
    })
    return
  }

  // result is DEFERRED_RESULT
  // this means we are displaying a prompt and are waiting for the user to approve
  Logger.info('asking user to approve request', request)

  const requestId = request.data.id
  const [action] = await take(isRequestApprovedOrRejected(requestId))

  if (onRequestRejected.match(action)) {
    Logger.info('user rejected request', request)
    rpcProvider.onError({
      request,
      error: action.payload.error,
      listenerApi
    })
    return
  }

  Logger.info('user approved request', request)
  if (handler.approve) {
    const approveResponse = await handler.approve(
      { ...action.payload },
      listenerApi
    )

    if (!approveResponse.success) {
      rpcProvider.onError({
        request,
        error: approveResponse.error,
        listenerApi
      })
    } else {
      rpcProvider.onSuccess({
        request,
        result: approveResponse.value,
        listenerApi
      })
    }
  }
}
