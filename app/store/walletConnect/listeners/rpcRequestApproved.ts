import { AppListenerEffectAPI } from 'store/index'
import handlerMap from '../handlers'
import { rpcRequestApproved, sendRpcResult } from '../slice'

export const onRpcRequestApproved = async (
  action: ReturnType<typeof rpcRequestApproved>,
  listenerApi: AppListenerEffectAPI
) => {
  // call onApproved callback if the handler implements it
  if (handlerMap.has(action.payload.request.payload.method)) {
    const handler = handlerMap.get(action.payload.request.payload.method)
    if (handler.onApprove) {
      handler.onApprove(action, listenerApi)
    } else {
      // otherwise we are good to send the result
      listenerApi.dispatch(
        sendRpcResult({
          request: action.payload.request
        })
      )
    }
  }
}
