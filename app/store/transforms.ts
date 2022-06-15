import { createTransform } from 'redux-persist'
import { deserializeBridgeState } from 'contexts/BridgeContext'
import { RawRootState } from 'store'
import { BridgeReducerState } from './bridge/BridgeState'

export const DeserializeBridgeTransform = createTransform<
  BridgeReducerState,
  BridgeReducerState,
  RawRootState,
  RawRootState
>(null, deserializeBridgeState, { whitelist: ['bridge'] })
