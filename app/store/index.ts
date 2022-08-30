import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'
import { AnyAction, configureStore, ListenerEffectAPI } from '@reduxjs/toolkit'
import {
  createMigrate,
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
import { nftsApi } from 'store/nft/api'
import { migrations } from 'store/migrations'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { networkReducer as network } from './network'
import { balanceReducer as balance, setBalance, setBalances } from './balance'
import { appReducer as app, onLogOut, onRehydrationComplete } from './app'
import { listener } from './middleware/listener'
import { accountsReducer as account } from './account'
import { watchlistReducer as watchlist } from './watchlist'
import { zeroBalanceReducer as zeroBalance } from './zeroBalance'
import { customTokenReducer as customToken } from './customToken'
import { posthogReducer as posthog } from './posthog'
import { nftReducer as nft } from './nft'
import networkFee from './networkFee'
import { addressBookReducer as addressBook } from './addressBook'
import settings from './settings'
import swap from './swap'
import { transactionApi } from './transaction'

const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]

// list of reducers that don't need to be persisted
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

  // user preferences
  settings,
  watchlist,
  zeroBalance,

  // apis
  [transactionApi.reducerPath]: transactionApi.reducer,
  [nftsApi.reducerPath]: nftsApi.reducer
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === onLogOut.type) {
    // reset state
    state = {
      app: state.app,
      watchlist: state.watchlist
    }
  }

  return combinedReducer(state, action)
}

export function configureEncryptedStore(secretKey: string) {
  const encryptionTransform = encryptTransform<
    RawRootState,
    RawRootState,
    RawRootState
  >({ secretKey })

  const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    blacklist,
    transforms: [
      DeserializeBridgeTransform,
      encryptionTransform // last!
    ],
    migrate: createMigrate(migrations, { debug: __DEV__ }),
    version: 2
  }

  const persistedReducer = persistReducer(persistConfig, rootReducer)

  const store = configureStore({
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
        .concat(nftsApi.middleware)
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
