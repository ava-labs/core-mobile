import { PayloadAction } from '@reduxjs/toolkit'
import {
  approveCall,
  approveSession
} from 'contexts/DappConnectionContext/useWalletConnect'
import { DappRpcRequest } from '../handlers/types'
import { isSessionRequestRpcRequest } from '../utils'

export const onSendRpcResult = async (
  action: PayloadAction<
    { request: DappRpcRequest<string, unknown>; result?: unknown },
    string
  >
) => {
  const { request, result } = action.payload

  if (isSessionRequestRpcRequest(request)) {
    approveSession(request.payload.params[0]?.peerId)
  } else {
    approveCall(request.payload.id, result)
  }
}
