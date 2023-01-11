import { AppListenerEffectAPI } from 'store/index'
import { rejectCall } from 'contexts/DappConnectionContext/useWalletConnect'
import { ethErrors } from 'eth-rpc-errors'
import handlerMap from '../handlers'
import { rpcRequestReceived } from '../slice'

export const onRpcRequestReceived = async (
  action: ReturnType<typeof rpcRequestReceived>,
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
