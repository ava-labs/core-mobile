import { AppListenerEffectAPI } from 'store/index'
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
import { RpcMethod } from 'services/walletconnect/types'
import { removeRequest, selectRpcRequests } from '../slice'

export const onSendRpcError = async (
  action: PayloadAction<{
    id: number
    error?: EthereumRpcError<unknown> | EthereumProviderError<unknown>
  }>,
  listenerApi: AppListenerEffectAPI
) => {
  const { id, error } = action.payload
  const requests = selectRpcRequests(listenerApi.getState())
  const request = requests.find(r => r.payload.id === id)

  listenerApi.dispatch(removeRequest(id))

  if (request?.payload.method === RpcMethod.SESSION_REQUEST) {
    rejectSession(request?.payload.peerMeta.peerId)
  } else {
    rejectCall(id, error ?? ethErrors.rpc.internal())
  }
}
