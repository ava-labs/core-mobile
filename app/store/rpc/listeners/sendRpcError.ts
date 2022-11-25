import { PayloadAction } from '@reduxjs/toolkit'
import {
  rejectCall,
  rejectSession
} from 'contexts/DappConnectionContext/useWalletConnect'
import {
  EthereumProviderError,
  EthereumRpcError,
  ethErrors
} from 'eth-rpc-errors'
import { DappRpcRequest } from '../handlers/types'
import { isSessionRequestRpcRequest } from '../utils'

export const onSendRpcError = async (
  action: PayloadAction<{
    request: DappRpcRequest<string, unknown>
    error?: EthereumRpcError<unknown> | EthereumProviderError<unknown>
  }>
) => {
  const { request, error } = action.payload

  if (isSessionRequestRpcRequest(request)) {
    rejectSession(request.payload.params[0]?.peerId)
  } else {
    rejectCall(request.payload.id, error ?? ethErrors.rpc.internal())
  }
}
