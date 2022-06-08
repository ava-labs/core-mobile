import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
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
import { networkReducer as network } from './network'
import { balanceReducer as balance, setBalance } from './balance'
import { appReducer as app, onRehydrationComplete } from './app'
import { listener } from './middleware/listener'
import { accountsReducer as account } from './account'

const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]

const rootReducer = combineReducers({
  app,
  network,
  balance,
  account
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['network', 'account']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  devTools: __DEV__,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [...persistActions, setBalance.type],
        ignoredPaths: ['balance']
      }
    }).prepend(listener.middleware)
})

export const persistor = persistStore(store, null, () => {
  // this block runs after rehydration is complete
  store.dispatch(onRehydrationComplete())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
