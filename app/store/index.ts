import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import network from './network'
import balance, { setBalance } from './balance'
import app, { onRehydrationComplete } from './app'
import { listener } from './middleware/listener'

const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]

const rootReducer = combineReducers({
  app,
  network,
  balance
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['network']
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
