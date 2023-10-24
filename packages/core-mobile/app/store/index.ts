import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { AnyAction, configureStore, ListenerEffectAPI } from '@reduxjs/toolkit'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import { bridgeReducer as bridge } from 'store/bridge'
import { nftsApi } from 'store/nft/api'
import { migrations } from 'store/migrations'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { EncryptThenMacTransform } from 'store/transforms/EncryptThenMacTransform'
import { networkReducer as network } from './network'
import { balanceReducer as balance } from './balance'
import { appReducer as app, onLogOut, onRehydrationComplete } from './app'
import { listener } from './middleware/listener'
import { accountsReducer as account } from './account'
import { notificationsReducer as notifications } from './notifications'
import { watchlistReducer as watchlist } from './watchlist'
import { portfolioReducer as portfolio } from './portfolio'
import { customTokenReducer as customToken } from './customToken'
import { securityReducer as security } from './security'
import { posthogReducer as posthog } from './posthog'
import { nftReducer as nft } from './nft'
import { addressBookReducer as addressBook } from './addressBook'
import { viewOnceReducer as viewOnce } from './viewOnce'
import settings from './settings'
import swap from './swap'
import { transactionApi } from './transaction'
import { walletConnectReducer as walletConnectV2 } from './walletConnectV2'
import { BridgeBlacklistTransform } from './transforms/BridgeBlacklistTransform'
import { WatchlistBlacklistTransform } from './transforms/WatchlistBlacklistTransform'
import { AppBlacklistTransform } from './transforms/AppBlacklistTransform'
import { browserReducer as browser } from './browser'

const VERSION = 8

// list of reducers that don't need to be persisted
// for nested/partial blacklist, please use transform
const blacklist = [
  'balance',
  'swap',
  'walletConnectV2',
  transactionApi.reducerPath,
  nftsApi.reducerPath
]

const combinedReducer = combineReducers({
  app,
  network,
  balance,
  account,
  notifications,
  addressBook,
  bridge,
  customToken,
  posthog,
  swap,
  nft,
  security,
  walletConnectV2,
  viewOnce,
  browser,

  // user preferences
  settings,
  watchlist,
  portfolio,

  // apis
  [transactionApi.reducerPath]: transactionApi.reducer,
  [nftsApi.reducerPath]: nftsApi.reducer
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === onLogOut.type) {
    // reset state
    // except the following keys
    // notes: keeping settings and network because watchlist depends on them
    state = {
      app: state.app,
      settings: {
        ...state.settings,
        securityPrivacy: {
          ...state.settings.securityPrivacy,
          consentToTOUnPP: false //don't keep consent to Terms of use and Privacy policy
        }
      },
      network: state.network,
      watchlist: state.watchlist,
      browser: state.browser
    }
  }

  return combinedReducer(state, action)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function configureEncryptedStore(secretKey: string) {
  const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    blacklist,
    rootReducer,
    transforms: [
      AppBlacklistTransform,
      BridgeBlacklistTransform,
      WatchlistBlacklistTransform,
      EncryptThenMacTransform(secretKey) // last!
    ],
    migrate: createMigrate(migrations, { debug: __DEV__ }),
    version: VERSION
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
        ...defaultMiddleWare,
        transactionApi.middleware,
        nftsApi.middleware
      ]

      // when storybook is enabled, no need to set up listeners
      if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
        middlewares.unshift(listener.middleware)
      }

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
