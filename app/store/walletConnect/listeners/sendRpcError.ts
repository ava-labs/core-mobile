import {
  rejectCall,
  rejectSession
} from 'contexts/DappConnectionContext/useWalletConnect'
import { ethErrors } from 'eth-rpc-errors'
import { sendRpcError } from '../slice'
import { isSessionRequestRpcRequest } from '../utils'

export const onSendRpcError = async (
  action: ReturnType<typeof sendRpcError>
) => {
  const { request, error } = action.payload

  if (isSessionRequestRpcRequest(request)) {
    rejectSession(request.payload.params[0]?.peerId)
  } else {
    rejectCall(request.payload.id, error ?? ethErrors.rpc.internal())
  }
}
