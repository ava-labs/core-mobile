import { createTransform } from 'redux-persist'
import { deserializeBridgeState } from 'contexts/BridgeContext'

export const DeserializeBridgeTransform = createTransform(
  (inboundState, _) => {
    return inboundState
  },
  (outboundState, _) => {
    return deserializeBridgeState(outboundState)
  },
  { whitelist: ['bridge'] }
)
