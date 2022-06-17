import { createTransform } from 'redux-persist'
import { deserializeBridgeState } from 'contexts/BridgeContext'
import { RawRootState } from 'store'
import { BridgeReducerState } from 'store/bridge/types'

export const DeserializeBridgeTransform = createTransform<
  BridgeReducerState,
  BridgeReducerState,
  RawRootState,
  RawRootState
>(null, deserializeBridgeState, { whitelist: ['bridge'] })
