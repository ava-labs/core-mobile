import { AnyAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import {
  EthereumProviderError,
  EthereumRpcError,
  ethErrors
} from 'eth-rpc-errors'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  onRequestApproved,
  onRequestRejected,
  onSendRpcError,
  onSendRpcResult,
  onRequest
} from '../slice'
import { DEFERRED_RESULT } from '../handlers/types'
import handlerMap from '../handlers'
import { Request, RpcMethod } from '../types'
import { isSessionProposal } from './utils'

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
) => {
  const { dispatch, take } = listenerApi

  const request = addRequestAction.payload
  const method = request.method
  const requestId = request.data.id
  const handler = handlerMap.get(method)

  Logger.info(`processing request ${requestId}`)

  if (!handler) {
    Logger.error(`RPC method ${method} not supported`)

    dispatch(
      onSendRpcError({
        request,
        error: ethErrors.rpc.methodNotSupported()
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
        error: action.payload.error
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
  request: Request,
  listenerApi: AppListenerEffectAPI
) => {
  if (isSessionProposal(request)) return

  if (chainAgnosticMethods.includes(request.method as RpcMethod)) return

  const { getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)

  // validate chain against the current developer mode
  const chainId = request.data.params.chainId.split(':')[1] ?? ''
  const network = selectNetwork(Number(chainId))(state)
  const isTestnet = Boolean(network?.isTestnet)

  if (isTestnet !== isDeveloperMode) {
    const message = isDeveloperMode
      ? 'Invalid environment. Please turn off developer mode and try again'
      : 'Invalid environment. Please turn on developer mode and try again'

    throw ethErrors.rpc.internal({
      message
    })
  }
}

const chainAgnosticMethods = [
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_UPDATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY
]
