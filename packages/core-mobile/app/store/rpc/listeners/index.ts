import { AppStartListening } from 'store/types'
import { onRequest } from '../slice'

import { processRequest } from './request/requests'

export const addRpcListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: onRequest,
    effect: processRequest
  })
}
