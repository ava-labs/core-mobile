import { useCallback, useEffect, useState } from 'react'
import { Account } from 'dto/Account'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CustomTokens } from 'screens/tokenManagement/hooks/useAddCustomToken'
import { NFTItemData } from 'screens/nft/NftCollection'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import { BN } from '@avalabs/avalanche-wallet-sdk'

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 *
 * Suffix "_<increasing number>" is for destructive migration of database. In the future, we want gracefully migrate data with no data loss.
 */
const WALLET_ID = 'WALLET_ID'
const USER_SETTINGS = 'USER_SETTINGS'
const ADDR_BOOK = 'ADDR_BOOK_1'
const ADDR_BOOK_RECENTS = 'ADDR_BOOK_RECENTS_1'
const WATCHLIST_FAVORITES = 'WATCHLIST_FAVORITES'
const CUSTOM_TOKENS = 'CUSTOM_TOKENS'
const NFTs = 'NFTs_2'
const VIEW_ONCE_INFORMATION = 'VIEW_ONCE_INFORMATION'
const PORTFOLIO_TOKEN_LIST = 'PORTFOLIO_TOKEN_LIST_3'

/**
 * ViewOnceInformation is used by views that needs to display something for the 1st time one.
 * After the user dismisses it, we persist the fact it has been shown once.
 *
 * The enum below can be used to add several items. Check is done simply by retrieving the
 * array and see if it includes the desired item, OR a convenience function:
 *
 * infoHasBeenShown: (info: InformationViewOnce) => boolean;
 *
 * will return true/false by passing the emum you want to check.
 */
export enum ViewOnceInformation {
  CHART_INTERACTION
}

export type AccountId = number
export type UID = string

export type Contact = {
  address: string
  title: string
  id: string
}

export type RecentContact = {
  id: AccountId | UID
  type: AddrBookItemType
}

export type Setting = 'CoreAnalytics' | 'ConsentToTOU&PP'
export type SettingValue = number | string | boolean

export type AddrBookItemType = 'account' | 'contact'

export type Repo = {
  informationViewOnceRepo: {
    viewOnceInfo: ViewOnceInformation[]
    infoHasBeenShown: (info: ViewOnceInformation) => boolean
    saveViewOnceInformation: (info: ViewOnceInformation[]) => void
  }
  watchlistFavoritesRepo: {
    watchlistFavorites: string[]
    saveWatchlistFavorites: (favorites: string[]) => void
  }
  accountsRepo: {
    accounts: Map<AccountId, Account>
    saveAccounts: (accounts: Map<AccountId, Account>) => void
    setActiveAccount: (accountIndex: number) => void
  }
  nftRepo: {
    nfts: Map<UID, NFTItemData>
    saveNfts: (nfts: Map<UID, NFTItemData>) => void
  }
  addressBookRepo: {
    addressBook: Map<UID, Contact>
    saveAddressBook: (addressBook: Map<UID, Contact>) => void
    recentContacts: RecentContact[]
    addToRecentContacts: (contact: RecentContact) => void
  }
  customTokenRepo: {
    customTokens: CustomTokens
    saveCustomTokens: (customTokens: CustomTokens) => Promise<void>
  }
  portfolioTokensCache: {
    loadTokensCache: (
      networkName: string
    ) => Promise<Map<string, TokenWithBalance>>
    saveTokensCache: (
      networkName: string,
      tokens: Map<string, TokenWithBalance>
    ) => void
  }
  /**
   * Store any simple user settings here
   */
  userSettingsRepo: {
    setSetting: (setting: Setting, value: SettingValue) => void
    getSetting: (setting: Setting) => SettingValue | undefined
  }
  flush: () => void
}

export function useRepo(): Repo {
  const [accounts, setAccounts] = useState<Map<AccountId, Account>>(new Map())
  const [nfts, setNfts] = useState<Map<UID, NFTItemData>>(new Map())
  const [addressBook, setAddressBook] = useState<Map<UID, Contact>>(new Map())
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [watchlistFavorites, setWatchlistFavorites] = useState<string[]>([])
  const [customTokens, setCustomTokens] = useState<CustomTokens>({})
  const [viewOnceInfo, setViewOnceInfo] = useState<ViewOnceInformation[]>([])
  const [userSettings, setUserSettings] = useState<Map<Setting, SettingValue>>(
    new Map()
  )

  useEffect(() => {
    loadInitialStatesFromStorage()
  }, [])

  const setSetting = (setting: Setting, value: SettingValue) => {
    userSettings.set(setting, value)
    const updatedSettings = new Map(userSettings)
    setUserSettings(updatedSettings)
    saveMapToStorage(USER_SETTINGS, updatedSettings).catch(reason =>
      console.error(reason)
    )
  }

  const getSetting = useCallback(
    (setting: Setting) => {
      return userSettings.get(setting)
    },
    [userSettings]
  )

  const saveAccounts = (accounts: Map<AccountId, Account>) => {
    setAccounts(new Map(accounts))
    saveAccountsToStorage(WALLET_ID, accounts).catch(reason =>
      console.error(reason)
    )
  }

  const setActiveAccount = (accountIndex: number) => {
    accounts.forEach(acc => (acc.active = acc.index === accountIndex))
    saveAccounts(accounts)
  }

  const saveAddressBook = (addrBook: Map<UID, Contact>) => {
    setAddressBook(new Map(addrBook))
    saveMapToStorage(ADDR_BOOK, addrBook).catch(reason => console.error(reason))
  }

  const saveNfts = (nfts: Map<UID, NFTItemData>) => {
    setNfts(new Map(nfts))
    saveMapToStorage(NFTs, nfts).catch(reason => console.error(reason))
  }

  const saveCustomTokens = (tokens: CustomTokens) => {
    setCustomTokens(tokens)
    return saveToStorage<CustomTokens>(CUSTOM_TOKENS, tokens)
  }

  const savePortfolioTokens = (
    networkName: string,
    tokens: Map<string, TokenWithBalance>
  ) => {
    saveMapToStorage(networkName + PORTFOLIO_TOKEN_LIST, tokens).catch(reason =>
      console.error(reason)
    )
  }

  const loadPortfolioTokens = async (networkName: string) => {
    const tokens = await loadFromStorageAsMap<string, TokenWithBalance>(
      networkName + PORTFOLIO_TOKEN_LIST
    )
    for (const token of tokens.values()) {
      token.balance = new BN(token.balance, token.denomination)
    }
    return tokens
  }

  const addToRecentContacts = (contact: RecentContact) => {
    const newRecents = [
      contact,
      ...recentContacts.filter(value => value.id !== contact.id)
    ].slice(0, 9) //save max 10 recents
    setRecentContacts(newRecents)
    saveToStorage(ADDR_BOOK_RECENTS, newRecents).catch(reason =>
      console.error(reason)
    )
  }

  const saveWatchlistFavorites = (favorites: string[]) => {
    setWatchlistFavorites(favorites)
    saveToStorage(WATCHLIST_FAVORITES, favorites).catch(reason =>
      console.error(reason)
    )
  }

  const saveViewOnceInformation = (info: ViewOnceInformation[]) => {
    // we use set so we don't allow duplicates
    const infoSet = [...new Set(info)]
    setViewOnceInfo(infoSet)
    saveToStorage(VIEW_ONCE_INFORMATION, infoSet).catch(error =>
      console.error(error)
    )
  }

  const infoHasBeenShown = (info: ViewOnceInformation) => {
    return viewOnceInfo.includes(info)
  }

  /**
   * Clear hook states
   */
  const flush = () => {
    setAccounts(new Map())
    setAddressBook(new Map())
    setNfts(new Map())
    setRecentContacts([])
    setWatchlistFavorites([])
    setCustomTokens({})
    setUserSettings(new Map())
  }

  function loadInitialStatesFromStorage() {
    loadFromStorageAsMap<Setting, SettingValue>(USER_SETTINGS).then(value =>
      setUserSettings(value)
    )
    loadFromStorageAsMap<AccountId, Account>(WALLET_ID).then(value =>
      setAccounts(value)
    )
    loadFromStorageAsMap<UID, NFTItemData>(NFTs).then(value => setNfts(value))
    loadFromStorageAsMap<UID, Contact>(ADDR_BOOK).then(value =>
      setAddressBook(value)
    )
    loadFromStorageAsArray<RecentContact>(ADDR_BOOK_RECENTS).then(value =>
      setRecentContacts(value)
    )
    loadFromStorageAsArray<string>(WATCHLIST_FAVORITES).then(value =>
      setWatchlistFavorites(value)
    )
    loadFromStorageAsObj<CustomTokens>(CUSTOM_TOKENS).then(value =>
      setCustomTokens(value)
    )
    loadFromStorageAsArray<ViewOnceInformation>(VIEW_ONCE_INFORMATION).then(
      value => setViewOnceInfo(value)
    )
  }

  return {
    accountsRepo: { accounts, saveAccounts, setActiveAccount },
    nftRepo: { nfts, saveNfts },
    addressBookRepo: {
      addressBook,
      saveAddressBook,
      recentContacts,
      addToRecentContacts
    },
    watchlistFavoritesRepo: { watchlistFavorites, saveWatchlistFavorites },
    customTokenRepo: { customTokens, saveCustomTokens },
    userSettingsRepo: {
      setSetting,
      getSetting
    },
    informationViewOnceRepo: {
      viewOnceInfo: viewOnceInfo,
      saveViewOnceInformation,
      infoHasBeenShown
    },
    portfolioTokensCache: {
      loadTokensCache: loadPortfolioTokens,
      saveTokensCache: savePortfolioTokens
    },
    flush
  }
}

async function loadFromStorageAsMap<K, V>(key: string) {
  const raw = await AsyncStorage.getItem(key)
  return raw ? (new Map(JSON.parse(raw)) as Map<K, V>) : new Map<K, V>()
}

async function loadFromStorageAsObj<T>(key: string) {
  const raw = await AsyncStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : {}
}

async function loadFromStorageAsArray<T>(key: string) {
  const raw = await AsyncStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T[]) : ([] as T[])
}

const omitBalance = (key: string, value: any) => {
  if (key === 'balance$') {
    return undefined
  } else {
    return value
  }
}

async function saveAccountsToStorage(
  walletId: string,
  accToStore: Map<AccountId, Account>
) {
  const stringifiedAccounts = JSON.stringify([...accToStore], omitBalance)
  if (stringifiedAccounts === undefined) {
    console.error('Could not stringify accounts: ', accToStore)
  } else {
    await AsyncStorage.setItem(walletId, stringifiedAccounts)
  }
}

async function saveMapToStorage<K, V>(key: string, map: Map<K, V>) {
  const stringified = JSON.stringify([...map])
  if (stringified === undefined) {
    console.error('Could not stringify: ', map)
  } else {
    await AsyncStorage.setItem(key, stringified)
  }
}

async function saveToStorage<T>(key: string, obj: T | T[]) {
  const stringified = JSON.stringify(obj)
  if (stringified === undefined) {
    console.error('Could not stringify: ', obj)
  } else {
    await AsyncStorage.setItem(key, stringified)
  }
}
