import { AppStartListening } from 'store/middleware/listener'
import {
  rpcRequestApproved,
  rpcRequestReceived,
  sendRpcError,
  sendRpcResult
} from '../slice'
import { onRpcRequestApproved } from './rpcRequestApproved'
import { onRpcRequestReceived } from './rpcRequestReceived'
import { onSendRpcError } from './sendRpcError'
import { onSendRpcResult } from './sendRpcResult'

export const addRpcListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: rpcRequestReceived,
    effect: onRpcRequestReceived
  })

  startListening({
    actionCreator: rpcRequestApproved,
    effect: onRpcRequestApproved
  })

  startListening({
    actionCreator: sendRpcResult,
    effect: onSendRpcResult
  })

  startListening({
    actionCreator: sendRpcError,
    effect: onSendRpcError
  })
}
