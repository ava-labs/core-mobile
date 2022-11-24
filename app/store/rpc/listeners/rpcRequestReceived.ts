import { AppListenerEffectAPI } from 'store/index'
import { PayloadAction } from '@reduxjs/toolkit'
import { rejectCall } from 'contexts/DappConnectionContext/useWalletConnect'
import { ethErrors } from 'eth-rpc-errors'
import { TypedJsonRpcRequest } from '../handlers/types'
import handlerMap from '../handlers'

export const onRpcRequestReceived = async (
  action: PayloadAction<TypedJsonRpcRequest<string, unknown>, string>,
  listenerApi: AppListenerEffectAPI
) => {
  if (handlerMap.has(action.payload.method)) {
    handlerMap.get(action.payload.method).handle(action, listenerApi)
    return
  }

  rejectCall(
    action.payload.id,
    ethErrors.rpc.internal({
      message: `RPC method ${action.payload.method} not supported`
    })
  )
}
