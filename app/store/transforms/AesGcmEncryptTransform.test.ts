import {
  AesGcmEncryptTransform,
  AesGcmStoreType
} from 'store/transforms/AesGcmEncryptTransform'
import { AppState, WalletState } from 'store/app'
import { BalanceState, QueryStatus } from 'store/balance'
import { ChannelId } from 'services/notifications/channels'
import { BridgeState } from 'store/bridge'
import { OngoingSwap, SwapState } from 'store/swap/types'
import {
  ConfigState,
  InvalidationState
} from '@reduxjs/toolkit/dist/query/core/apiState'
import { initialState as advancedState } from 'store/settings/advanced/types'
import { initialState as securityState } from 'store/settings/securityPrivacy/types'
import { initialState as currencyState } from 'store/settings/currency/types'
import { NetworkState } from 'store/network'
import { AccountsState } from 'store/account'
import { NotificationsState } from 'store/notifications'
import { AddressBookState } from 'store/addressBook'
import { PosthogState } from 'store/posthog'
import { CustomTokenState } from 'store/customToken'
import { NftState } from 'store/nft'
import { SecurityState } from 'store/security'
import { WalletConnectState } from 'store/walletConnectV2'
import { WatchListState } from 'store/watchlist'
import { PortfolioState } from 'store/portfolio'
import { RawRootState, RootState } from 'store/index'
import { encryptTransform } from 'redux-persist-transform-encrypt'

const initialState = {
  app: {
    isReady: true,
    isLocked: true,
    appState: 'active',
    walletState: WalletState.ACTIVE
  } as AppState,
  network: {
    networks: {},
    customNetworks: {},
    favorites: [],
    active: 0
  } as NetworkState,
  balance: {
    status: QueryStatus.IDLE,
    balances: {}
  } as BalanceState,
  account: {
    accounts: {},
    activeAccountIndex: 0
  } as AccountsState,
  notifications: {
    notificationSubscriptions: { [ChannelId.STAKING_COMPLETE]: true },
    hasPromptedAfterFirstDelegation: false
  } as NotificationsState,
  addressBook: {
    contacts: {},
    recentContacts: [],
    editingContact: undefined
  } as AddressBookState,
  bridge: {} as BridgeState,
  customToken: {
    tokens: {}
  } as CustomTokenState,
  posthog: {
    userID: '',
    distinctID: '',
    isAnalyticsEnabled: false,
    featureFlags: {}
  } as PosthogState,
  swap: {
    currentSwap: {} as OngoingSwap
  } as SwapState,
  nft: {
    hiddenNfts: {},
    nfts: {}
  } as NftState,
  security: {
    loginAttempt: {
      count: 0,
      timestamp: 0
    }
  } as SecurityState,
  walletConnectV2: {
    requestStatuses: {}
  } as WalletConnectState,
  settings: {
    currency: currencyState,
    securityPrivacy: securityState,
    advanced: advancedState
  },
  watchlist: {
    tokens: {},
    favorites: [],
    prices: {},
    charts: {}
  } as WatchListState,
  portfolio: {
    tokenBlacklist: []
  } as PortfolioState,
  transactionApi: {
    queries: {},
    mutations: {},
    provided: {} as InvalidationState<never>,
    subscriptions: {},
    config: {} as ConfigState<'transactionApi'>
  },
  nftApi: {
    queries: {},
    mutations: {},
    provided: {} as InvalidationState<never>,
    subscriptions: {},
    config: {} as ConfigState<'nftApi'>
  }
} as RootState

const secretKey =
  '037f948ec4fc19c751a8508744626399768efc81d07e2b9dd5ad298196328efa'

describe('AesGcmEncryptTransform functions', () => {
  it('should decode to same encoded object', () => {
    const transform = AesGcmEncryptTransform(secretKey)
    const encoded = transform.in(initialState, 'app', initialState)
    expect(encoded).not.toEqual(initialState)

    const decoded = transform.out(encoded, 'app', initialState)
    expect(decoded).toEqual(initialState)
  })

  it('should successfully decrypt state encrypted using redux-persist-transform-encrypt library', () => {
    const state = { test: 'test' }
    const reduxPersistTransformEncrypt = encryptTransform<
      typeof state,
      typeof state,
      typeof state
    >({
      secretKey
    })
    const stateEncrypted = reduxPersistTransformEncrypt.in(state, 'test', state)

    const transform = AesGcmEncryptTransform(secretKey)
    const decrypted = transform.out(
      stateEncrypted as unknown as AesGcmStoreType,
      'app',
      {} as unknown as RawRootState
    )
    expect(decrypted).toEqual(state)
  })

  it('should fail decrypting if state is object but not AesGcmStoreType', async () => {
    const state = { test: 'test' }
    const transform = AesGcmEncryptTransform(secretKey)
    await expect(async () => {
      transform.out(
        state as unknown as AesGcmStoreType,
        'app',
        {} as unknown as RawRootState
      )
    }).rejects.toThrow('Unknown state, expecting AesGcmStoreType')
  })
})
