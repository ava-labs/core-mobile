import { isAnyOf } from '@reduxjs/toolkit'
import { rpcErrors, JsonRpcError } from '@metamask/rpc-errors'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { WalletState } from 'store/app/types'
import { onAppUnlocked, selectWalletState } from 'store/app/slice'
import { onRequest } from '../../slice'
import providerMap from '../../providers'
import { handleRequestInternally } from './handleRequestInternally'
import { handleRequestViaVMModule } from './handleRequestViaVMModule'
import { findHandlerOrModule } from './findHandlerOrModule'

export const processRequest = async (
  addRequestAction: ReturnType<typeof onRequest>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition } = listenerApi
  const request = addRequestAction.payload
  const method = request.method
  const rpcProvider = providerMap.get(request.provider)
  const state = listenerApi.getState()

  if (selectWalletState(state) === WalletState.INACTIVE) {
    // wait until app is unlocked
    await condition(isAnyOf(onAppUnlocked))
  }

  Logger.info('processing request', {
    method: request.method,
    data: request.data
  })

  if (!rpcProvider) {
    Logger.error(`RPC Provider ${request.provider} not supported`)
    return
  }

  const handlerOrModule = await findHandlerOrModule(request, method)

  if (!handlerOrModule) {
    Logger.error(`RPC method ${method} not supported`)
    rpcProvider.onError({
      request,
      error: rpcErrors.methodNotSupported(),
      listenerApi
    })

    return
  }

  try {
    rpcProvider.validateRequest(request, listenerApi)
  } catch (error) {
    Logger.error('rpc request is invalid', error)

    if (error instanceof JsonRpcError) {
      rpcProvider.onError({
        request,
        error,
        listenerApi
      })

      return
    }
  }

  if ('handle' in handlerOrModule) {
    return handleRequestInternally({
      rpcProvider,
      request,
      handler: handlerOrModule,
      listenerApi
    })
  } else {
    return handleRequestViaVMModule({
      module: handlerOrModule,
      request,
      rpcProvider,
      listenerApi
    })
  }
}
