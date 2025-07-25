import { ChainId } from '@avalabs/core-chains-sdk'
import BiometricsSDK, {
  ENCRYPTION_KEY_SERVICE,
  ENCRYPTION_KEY_SERVICE_BIO
} from 'utils/BiometricsSDK'
import {
  Contact,
  CoreAccountType,
  WalletType as CoreWalletType,
  CorePrimaryAccount
} from '@avalabs/types'
import {
  Account,
  AccountsState,
  AccountCollection,
  PrimaryAccount
} from 'store/account'
import { WalletType } from 'services/wallet/types'
import { AddressBookState } from 'store/addressBook'
import { uuid } from 'utils/uuid'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { ChannelId } from 'services/notifications/channels'
import Keychain from 'react-native-keychain'
import Logger from 'utils/Logger'
import { initialState as watchlistInitialState } from './watchlist'
import {
  DefaultFeatureFlagConfig,
  initialState as posthogInitialState
} from './posthog'
import { initialState as browserFavoritesInitialState } from './browser/slices/favorites'
import { getInitialState as browserTabsGetInitialState } from './browser/slices/tabs'
import { initialState as browserGlobalHistoryInitialState } from './browser/slices/globalHistory'
import { ViewOnceKey } from './viewOnce'
import { CollectibleVisibility, TokenVisibility } from './portfolio'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const migrations = {
  1: (state: any) => {
    // replace watchlist store
    return {
      ...state,
      watchlist: {
        tokens: [],
        favorites: []
      }
    }
  },
  2: (state: any) => {
    // expand nft store with nfts
    return {
      ...state,
      nft: {
        ...state.nft,
        nfts: {}
      }
    }
  },
  3: (state: any) => {
    return {
      ...state,
      watchlist: watchlistInitialState
    }
  },
  4: (state: any) => {
    return {
      ...state,
      posthog: {
        distinctID: posthogInitialState.distinctID,
        userID: state.posthog.userID
      }
    }
  },
  5: (state: any) => {
    // migrate BTC and BTC testnet chainIds
    const updatedFavorites = state.network.favorites.map((chainId: number) => {
      if (chainId === -1) {
        return ChainId.BITCOIN
      }

      if (chainId === -2) {
        return ChainId.BITCOIN_TESTNET
      }

      return chainId
    })

    let updatedActive = state.network.active

    if (updatedActive === -1) {
      updatedActive = ChainId.BITCOIN
    } else if (updatedActive === -2) {
      updatedActive = ChainId.BITCOIN_TESTNET
    }

    return {
      ...state,
      network: {
        ...state.network,
        favorites: updatedFavorites,
        active: updatedActive
      }
    }
  },
  6: async (state: any) => {
    return state
  },
  7: (state: any) => {
    if (state.posthog.featureFlags === undefined) {
      return {
        ...state,
        posthog: {
          ...state.posthog,
          featureFlags: DefaultFeatureFlagConfig
        }
      }
    }

    return state
  },
  8: (state: any) => {
    delete state.walletConnect
    return state
  },
  9: async (state: any) => {
    // for people upgrading from < 9, if they have set biometrics or pin,
    // it means they have created a mnemonic wallet
    const isLoggedIn = await BiometricsSDK.getAccessType()

    return {
      ...state,
      app: {
        ...state.app,
        walletType: isLoggedIn ? WalletType.MNEMONIC : WalletType.UNSET
      }
    }
  },
  10: async (state: any) => {
    return {
      ...state,
      // reset browser data
      browser: {
        favorites: browserFavoritesInitialState,
        globalHistory: browserGlobalHistoryInitialState,
        tabs: browserTabsGetInitialState()
      },
      // set security countdown
      security: {
        loginAttempt: {
          count: state.security.loginAttempt.count,
          countdown: 0
        }
      }
    }
  },
  11: (state: any) => {
    const newState = { ...state, nft: { ...state.nft } }
    delete newState.nft.nfts
    return newState
  },
  12: (state: any) => {
    return {
      ...state,
      network: {
        customNetworks: state.network.customNetworks,
        favorites: state.network.favorites,
        active: state.network.active
      },
      watchlist: {
        favorites: state.watchlist.favorites
      }
    }
  },
  13: (state: any) => {
    const newState = {
      ...state,
      settings: {
        ...state.settings,
        currency: {
          ...state.settings.currency
        }
      }
    }
    delete newState.settings.currency.currencies
    return newState
  },
  14: (state: any) => {
    //migrate Account type to CorePrimaryAccount
    type OldAccountType = {
      index: number
      title: string
      addressBtc: string
      address: string
      addressAVM?: string
      addressPVM?: string
      addressCoreEth?: string
    }
    const newState = { ...state }
    const accountState = newState.account as AccountsState
    const walletTypeMapping = {
      [WalletType.MNEMONIC]: CoreWalletType.Mnemonic,
      [WalletType.SEEDLESS]: CoreWalletType.Seedless,
      [WalletType.UNSET]: undefined
    }
    const walletType = state.app.walletType as WalletType
    // @ts-ignore WalletType.PRIVATE_KEY is added in migration 21, so the newWalletType type is any
    const newWalletType = walletTypeMapping[walletType]

    Object.entries(accountState.accounts).forEach(([accIndex, account]) => {
      const oldAccount = account as unknown as OldAccountType
      if (!newWalletType) {
        throw new Error(
          'invalid db state: has accounts but wallet type is not set!'
        )
      }

      // @ts-ignore
      accountState.accounts[Number(accIndex)] = {
        index: Number(accIndex),
        id: uuid(),
        walletId: CORE_MOBILE_WALLET_ID,
        name: oldAccount.title,
        type: CoreAccountType.PRIMARY,
        walletType: newWalletType,
        // @ts-ignore activeAccountIndex is removed from accountState
        active: accountState.activeAccountIndex === Number(accIndex),
        addressBTC: oldAccount.addressBtc,
        addressAVM: oldAccount.addressAVM,
        addressPVM: oldAccount.addressPVM,
        addressC: oldAccount.address,
        addressCoreEth: oldAccount.addressCoreEth
      } as Account
    })

    newState.account = accountState
    return newState
  },
  15: (state: any) => {
    type OldContactType = {
      address: string
      addressBtc: string
      addressPVM: string
      title: string
      id: string
    }
    //migrate Contact type to @avalanche/Contact
    const newState = { ...state }
    const addressBookState = newState.addressBook as AddressBookState

    Object.entries(addressBookState.contacts).forEach(([uid, contact]) => {
      const oldContact = contact as unknown as OldContactType
      // @ts-ignore
      addressBookState.contacts[uid] = {
        id: oldContact.id,
        name: oldContact.title,
        address: oldContact.address,
        addressXP: oldContact.addressPVM,
        addressBTC: oldContact.addressBtc,
        isKnown: true
      } as Contact
    })

    newState.addressBook = addressBookState
    return newState
  },
  16: (state: any) => {
    const newState = {
      ...state,
      notifications: {
        ...state.notifications,
        notificationSubscriptions: {
          ...state.notifications.notificationSubscriptions,
          [ChannelId.PRODUCT_ANNOUNCEMENTS]: true,
          [ChannelId.OFFERS_AND_PROMOTIONS]: true,
          [ChannelId.MARKET_NEWS]: true,
          [ChannelId.BALANCE_CHANGES]: true,
          [ChannelId.STAKING_COMPLETE]: true,
          [ChannelId.PRICE_ALERTS]: true
        }
      },
      viewOnce: {
        data: {
          ...state.viewOnce.data,
          [ViewOnceKey.NOTIFICATIONS_PROMPT]: true
        }
      }
    }
    delete newState.notifications.hasPromptedAfterFirstDelegation
    delete newState.notifications.hasPromptedForBalanceChange
    return newState
  },
  17: (state: any) => {
    const tokenVisibility = state.portfolio.tokenBlacklist.reduce(
      (acc: TokenVisibility, tokenId: string) => {
        acc[tokenId.toLowerCase()] = false
        return acc
      },
      {}
    ) as TokenVisibility
    const newState = {
      ...state,
      portfolio: {
        ...state.portfolio,
        tokenVisibility
      }
    }
    delete newState.portfolio.tokenBlacklist
    return newState
  },
  18: (state: any) => {
    const enabledChainIds = state.network.favorites
    return {
      ...state,
      network: {
        ...state.network,
        enabledChainIds,
        disabledLastTransactedChainIds: []
      }
    }
  },
  19: (state: any) => {
    // in the mobile next-gen app, we don't have the concept of active network anymore,
    // we will default active network to avalanche c-chain until we remove active network
    // everywhere in the app
    return {
      ...state,
      network: {
        ...state.network,
        active: ChainId.AVALANCHE_MAINNET_ID
      },
      settings: {
        ...state.settings,
        advanced: {
          ...state.settings.advanced,
          developerMode: false
        }
      }
    }
  },
  20: (state: any) => {
    const collectibleVisibility = Object.entries(
      state.nft?.hiddenNfts ?? {}
    ).reduce((acc: CollectibleVisibility, [tokenId, _]) => {
      acc[tokenId.toLowerCase()] = false
      return acc
    }, {}) as CollectibleVisibility
    const newState = {
      ...state,
      portfolio: {
        ...state.portfolio,
        collectibleVisibility,
        collectibleUnprocessableVisibility: false
      }
    }
    delete newState.nft
    return newState
  },
  21: async (state: any) => {
    // Get all services from keychain
    await Keychain.resetGenericPassword({ service: ENCRYPTION_KEY_SERVICE })
    await Keychain.resetGenericPassword({
      service: ENCRYPTION_KEY_SERVICE_BIO
    })
    // Generate a new wallet ID
    const walletId = uuid()
    // Migrate stored wallet structure
    const newState = { ...state }

    // If there's an existing account state, migrate it to the new wallet structure
    if (state.account && state.account.accounts) {
      Logger.info('Migrating account state')
      const accountState = newState.account as AccountsState
      const walletType = state.app.walletType as WalletType

      // Create a new wallet entry
      const walletName =
        // @ts-ignore walletName not part of accountState anymore
        // @ts-ignore
        accountState.walletName ||
        `Wallet ${Object.keys(accountState.accounts).length + 1}`

      // Add wallet to the wallets state
      newState.wallet = {
        wallets: {
          [walletId]: {
            id: walletId,
            name: walletName,
            type: walletType
          }
        },
        activeWalletId: walletId
      }
    }
    Logger.info('newState.wallet:', newState.wallet)
    return newState
  },
  22: (state: any) => {
    Logger.info('state.account', state.account)
    // Check if migration is needed (presence of activeAccountIndex)
    if (state.account?.activeAccountIndex === undefined) {
      return state // Already migrated or new state
    }

    const oldAccountsState = state.account
    const activeWalletId = state.wallet?.activeWalletId

    if (!activeWalletId) {
      // this is fresh install, no need to migrate
      return state
    }
    const newAccountsCollection: AccountCollection = {}
    let newActiveAccountId: string | null = null

    Object.entries(oldAccountsState.accounts).forEach(
      ([accIndex, oldAccountData]) => {
        const oldAccount = oldAccountData as CorePrimaryAccount // Old state only had CorePrimaryAccount
        const index = Number(accIndex)

        // Create the new account structure (PrimaryAccount)
        const newAccount: PrimaryAccount = {
          // Keep essential properties from CorePrimaryAccount
          name: oldAccount.name,
          type: CoreAccountType.PRIMARY,
          addressBTC: oldAccount.addressBTC,
          addressC: oldAccount.addressC,
          addressAVM: oldAccount.addressAVM,
          addressPVM: oldAccount.addressPVM,
          addressCoreEth: oldAccount.addressCoreEth,
          addressSVM: oldAccount.addressSVM,
          // Add new/changed properties
          id: uuid(),
          walletId: activeWalletId,
          index: index
        }

        newAccountsCollection[newAccount.id] = newAccount

        // Check if this account was the active one
        if (oldAccount.active) {
          newActiveAccountId = newAccount.id
        }
      }
    )

    const newAccountsState: AccountsState = {
      accounts: newAccountsCollection,
      activeAccountId: newActiveAccountId
    }

    Logger.info('newAccountsState', newAccountsState)
    return {
      ...state,
      account: newAccountsState
    }
  },
  23: (state: any) => {
    // Ensure lockWalletWithPIN exists in securityPrivacy settings
    return {
      ...state,
      settings: {
        ...state.settings,
        securityPrivacy: {
          ...state.settings.securityPrivacy,
          lockWalletWithPIN: true
        }
      }
    }
  }
}
