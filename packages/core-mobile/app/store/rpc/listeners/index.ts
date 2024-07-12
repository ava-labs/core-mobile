import { AppStartListening } from 'store/middleware/listener'
import { onRequest } from '../slice'

import { processRequest } from './request/requests'

export const addRpcListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: onRequest,
    effect: processRequest
  })
}
