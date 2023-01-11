import {
  approveCall,
  approveSession
} from 'contexts/DappConnectionContext/useWalletConnect'
import { sendRpcResult } from '../slice'
import { isSessionRequestRpcRequest } from '../utils'

export const onSendRpcResult = async (
  action: ReturnType<typeof sendRpcResult>
) => {
  const { request, result } = action.payload

  if (isSessionRequestRpcRequest(request)) {
    approveSession(request.payload.params[0]?.peerId)
  } else {
    approveCall(request.payload.id, result)
  }
}
