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
import { customTokenReducer as customToken } from './customToken'
import { posthogReducer as posthog } from './posthog'
import networkFee from './networkFee'
import { addressBookReducer as addressBook } from './addressBook'
import settings from './settings'
import swap from './swap'
import { transactionApi } from './transaction'

const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]

const rootReducer = combineReducers({
  app,
  network,
  balance,
  account,
  networkFee,
  addressBook,
  bridge,
  customToken,
  posthog,
  swap,

  // user preferences
  settings,
  watchlist,
  zeroBalance,

  // apis
  [transactionApi.reducerPath]: transactionApi.reducer
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['app', 'balance', 'networkFee', transactionApi.reducerPath],
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
    })
      .prepend(listener.middleware)
      .concat(transactionApi.middleware)
})

export const persistor = persistStore(store, null, () => {
  // this block runs after rehydration is complete
  store.dispatch(onRehydrationComplete())
})

export type RawRootState = ReturnType<typeof rootReducer>
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>
