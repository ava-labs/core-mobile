import { AppStartListening } from 'store/middleware/listener'
import { onRequest, waitForTransactionReceipt } from '../slice'
import { handleWaitForTransactionReceipt } from './handleWaitForTransactionReceipt'

import { processRequest } from './requests'

export const addRpcListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: onRequest,
    effect: processRequest
  })

  startListening({
    actionCreator: waitForTransactionReceipt,
    effect: async (action, listenerApi) =>
      handleWaitForTransactionReceipt(
        listenerApi,
        action.payload.txResponse,
        action.payload.requestId,
        action.payload.requestedNetwork
      )
  })
}
