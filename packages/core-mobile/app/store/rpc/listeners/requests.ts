import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import {
  EthereumProviderError,
  EthereumRpcError,
  ethErrors
} from 'eth-rpc-errors'
import Logger from 'utils/Logger'
import { onAppUnlocked, selectWalletState, WalletState } from 'store/app'
import { onRequest, onRequestApproved, onRequestRejected } from '../slice'
import { DEFERRED_RESULT } from '../handlers/types'
import handlerMap from '../handlers'
import providerMap from '../providers'

// check if request is either onRequestApproved or onRequestRejected
// and also if the request is the one we are waiting for
const isRequestApprovedOrRejected =
  (requestId: number) => (action: AnyAction) => {
    if (onRequestApproved.match(action) || onRequestRejected.match(action)) {
      return action.payload.request.data.id === requestId
    }

    return false
  }

export const processRequest = async (
  addRequestAction: ReturnType<typeof onRequest>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { take, condition } = listenerApi
  const { provider, request } = addRequestAction.payload
  const method = request.method
  const requestId = request.data.id
  const handler = handlerMap.get(method)
  const rpcProvider = providerMap.get(provider)
  const state = listenerApi.getState()

  if (selectWalletState(state) === WalletState.INACTIVE) {
    // wait until app is unlocked
    await condition(isAnyOf(onAppUnlocked))
  }

  Logger.info('processing request', request)

  if (!rpcProvider) {
    Logger.error(`RPC Provider ${provider} not supported`)

    return
  }

  if (!handler) {
    Logger.error(`RPC method ${method} not supported`)

    rpcProvider.onError({
      request,
      error: ethErrors.rpc.methodNotSupported(),
      listenerApi
    })

    return
  }

  try {
    rpcProvider.validateRequest(request, listenerApi)
  } catch (error) {
    Logger.error('rpc request is invalid', error)

    if (
      error instanceof EthereumRpcError ||
      error instanceof EthereumProviderError
    ) {
      rpcProvider.onError({
        request,
        error,
        listenerApi
      })

      return
    }
  }

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
