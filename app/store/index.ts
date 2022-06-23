import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { configureStore, ListenerEffectAPI } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE
} from 'redux-persist'
import { DeserializeBridgeTransform } from 'store/transforms'
import bridge, { addBridgeTransaction } from 'store/bridge'
import { networkReducer as network } from './network'
import { balanceReducer as balance, setBalance, setBalances } from './balance'
import { appReducer as app, onRehydrationComplete } from './app'
import { listener } from './middleware/listener'
import { accountsReducer as account } from './account'
import { watchlistReducer as watchlist } from './watchlist'
import { zeroBalanceReducer as zeroBalance } from './zeroBalance'
import networkFee from './networkFee'
import settings from './settings'

const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]

const rootReducer = combineReducers({
  app,
  network,
  balance,
  account,
  networkFee,
  bridge,

  // user preferences
  settings,
  watchlist,
  zeroBalance
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: [
    'network',
    'account',
    'settings',
    'bridge',
    'watchlist',
    'zeroBalance'
  ],
  transforms: [DeserializeBridgeTransform]
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  devTools: __DEV__,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          ...persistActions,
          setBalance.type,
          setBalances.type,
          addBridgeTransaction.type
        ],
        ignoredPaths: ['balance', 'networkFee', 'bridge']
      }
    }).prepend(listener.middleware)
})

export const persistor = persistStore(store, null, () => {
  // this block runs after rehydration is complete
  store.dispatch(onRehydrationComplete())
})

export type RawRootState = ReturnType<typeof rootReducer>
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>
