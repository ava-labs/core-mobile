import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { AnyAction, configureStore, ListenerEffectAPI } from '@reduxjs/toolkit'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import {
  DeserializeBridgeTransform,
  WalletConnectBlacklistTransform,
  WatchlistBlacklistTransform
} from 'store/transforms'
import bridge from 'store/bridge'
import { nftsApi } from 'store/nft/api'
import { migrations } from 'store/migrations'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { networkReducer as network } from './network'
import { balanceReducer as balance } from './balance'
import { appReducer as app, onLogOut, onRehydrationComplete } from './app'
import { listener } from './middleware/listener'
import { accountsReducer as account } from './account'
import { watchlistReducer as watchlist } from './watchlist'
import { portfolioReducer as portfolio } from './portfolio'
import { customTokenReducer as customToken } from './customToken'
import { securityReducer as security } from './security'
import { posthogReducer as posthog } from './posthog'
import { nftReducer as nft } from './nft'
import networkFee from './networkFee'
import { addressBookReducer as addressBook } from './addressBook'
import settings from './settings'
import swap from './swap'
import { transactionApi } from './transaction'
import { walletConnectReducer as walletConnect } from './walletConnect'

// list of reducers that don't need to be persisted
// for nested blacklist, please use transform
const blacklist = [
  'app',
  'balance',
  'networkFee',
  'swap',
  transactionApi.reducerPath,
  nftsApi.reducerPath
]

const combinedReducer = combineReducers({
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
  nft,
  security,
  walletConnect,

  // user preferences
  settings,
  watchlist,
  portfolio,

  // apis
  [transactionApi.reducerPath]: transactionApi.reducer,
  [nftsApi.reducerPath]: nftsApi.reducer
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === onLogOut.type) {
    // reset state
    // except the following keys
    // notes: keeping settings and network because watchlist depends on them
    state = {
      app: state.app,
      settings: state.settings,
      network: state.network,
      watchlist: state.watchlist
    }
  }

  return combinedReducer(state, action)
}

export function configureEncryptedStore(secretKey: string) {
  // If this transform fails to decrypt or parse then it will log a warning and
  // return `undefined`, which will cause the redux state to be reset.
  const encryptionTransform = encryptTransform<
    RawRootState,
    RawRootState,
    RawRootState
  >({ secretKey })

  const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    blacklist,
    rootReducer,
    transforms: [
      DeserializeBridgeTransform,
      WatchlistBlacklistTransform,
      WalletConnectBlacklistTransform,
      encryptionTransform // last!
    ],
    migrate: createMigrate(migrations, { debug: __DEV__ }),
    version: 3
  }

  const persistedReducer = persistReducer(persistConfig, rootReducer)

  const store = configureStore({
    reducer: persistedReducer,
    devTools: __DEV__,
    middleware: getDefaultMiddleware => {
      const defaultMiddleWare = getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false
      })

      const middlewares = [
        listener.middleware,
        ...defaultMiddleWare,
        transactionApi.middleware,
        nftsApi.middleware
      ]

      if (__DEV__) {
        const createDebugger = require('redux-flipper').default
        middlewares.push(createDebugger())
      }

      return middlewares
    }
  })

  const persistor = persistStore(store, null, () => {
    // this block runs after rehydration is complete
    store.dispatch(onRehydrationComplete())
  })

  return { store, persistor }
}

type ConfiguredStore = ReturnType<typeof configureEncryptedStore>['store']
export type RawRootState = ReturnType<typeof rootReducer>
export type RootState = ReturnType<ConfiguredStore['getState']>
export type AppDispatch = ConfiguredStore['dispatch']
export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>
