import { combineReducers } from 'redux'
import { AnyAction, configureStore, ListenerEffectAPI } from '@reduxjs/toolkit'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import { bridgeReducer as bridge } from 'store/bridge'
import { unifiedBridgeReducer as unifiedBridge } from 'store/unifiedBridge'
import { migrations } from 'store/migrations'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { EncryptThenMacTransform } from 'store/transforms/EncryptThenMacTransform'
import reactotron from '../../ReactotronConfig'
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
import { transactionApi } from './transaction'
import { rpcReducer as rpc } from './rpc'
import { BridgeBlacklistTransform } from './transforms/BridgeBlacklistTransform'
import { AppBlacklistTransform } from './transforms/AppBlacklistTransform'
import { combinedReducer as browser } from './browser'
import { snapshotsReducer as snapshots } from './snapshots/slice'
import { reduxStorage } from './reduxStorage'

const VERSION = 17

// list of reducers that don't need to be persisted
// for nested/partial blacklist, please use transform
const blacklist = ['balance', 'swap', 'rpc', transactionApi.reducerPath]

const combinedReducer = combineReducers({
  app,
  network,
  balance,
  account,
  notifications,
  addressBook,
  bridge,
  unifiedBridge,
  customToken,
  posthog,
  nft,
  security,
  rpc,
  viewOnce,
  browser,
  snapshots,

  // user preferences
  settings,
  watchlist,
  portfolio,

  // apis
  [transactionApi.reducerPath]: transactionApi.reducer
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === onLogOut.type) {
    // reset state
    // except the following keys
    state = {
      app: state.app,
      posthog: state.posthog
    }
  }

  return combinedReducer(state, action)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function configureEncryptedStore(secretKey: string, macSecret: string) {
  const persistConfig = {
    key: 'root',
    storage: reduxStorage,
    blacklist,
    rootReducer,
    transforms: [
      AppBlacklistTransform,
      BridgeBlacklistTransform,
      EncryptThenMacTransform(secretKey, macSecret) // last!
    ],
    migrate: createMigrate(migrations, { debug: __DEV__ }),
    version: VERSION
  }

  const persistedReducer = persistReducer(persistConfig, rootReducer)

  const store = configureStore({
    reducer: persistedReducer,
    devTools: __DEV__,
    enhancers:
      __DEV__ && reactotron !== undefined ? [reactotron.createEnhancer()] : [],
    middleware: getDefaultMiddleware => {
      const defaultMiddleWare = getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false
      })

      const middlewares = [...defaultMiddleWare, transactionApi.middleware]

      // when storybook is enabled, no need to set up listeners
      if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
        middlewares.unshift(listener.middleware)
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
export type ThunkApi = {
  state: RootState
  dispatch: AppDispatch
}
