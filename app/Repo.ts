import { useCallback, useEffect, useState } from 'react'
import { CustomTokens } from 'screens/tokenManagement/hooks/useAddCustomToken'
import { NFTItemData } from 'screens/nft/NftCollection'
import StorageTools from 'repository/StorageTools'
import {
  BridgeState,
  defaultBridgeState
} from 'screens/bridge/utils/BridgeState'

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 *
 * Suffix "_<increasing number>" is for destructive migration of database. In the future, we want gracefully migrate data with no data loss.
 */
const USER_SETTINGS = 'USER_SETTINGS'
const ADDR_BOOK = 'ADDR_BOOK_1'
const ADDR_BOOK_RECENTS = 'ADDR_BOOK_RECENTS_1'
const WATCHLIST_FAVORITES = 'WATCHLIST_FAVORITES'
const CUSTOM_TOKENS = 'CUSTOM_TOKENS'
const NFTs = 'NFTs_2'
const VIEW_ONCE_INFORMATION = 'VIEW_ONCE_INFORMATION'
const PENDING_BRIDGE_TRANSACTIONS = 'PENDING_BRIDGE_TRANSACTIONS'

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
export type SettingValue = number | string | boolean | undefined

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
  pendingBridgeTransactions: {
    pendingBridgeTransactions: BridgeState
    savePendingBridgeTransactions: (newState: BridgeState) => void
  }
  /**
   * Store any simple user settings here
   */
  userSettingsRepo: {
    setSetting: (setting: Setting, value: SettingValue) => void
    getSetting: (setting: Setting) => SettingValue | undefined
  }
  flush: () => void
  initialized: boolean
}

export function useRepo(): Repo {
  const [initialized, setInitialized] = useState(false)
  const [nfts, setNfts] = useState<Map<UID, NFTItemData>>(new Map())
  const [addressBook, setAddressBook] = useState<Map<UID, Contact>>(new Map())
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [watchlistFavorites, setWatchlistFavorites] = useState<string[]>([])
  const [customTokens, setCustomTokens] = useState<CustomTokens>({})
  const [viewOnceInfo, setViewOnceInfo] = useState<ViewOnceInformation[]>([])
  const [userSettings, setUserSettings] = useState<Map<Setting, SettingValue>>(
    new Map()
  )
  const [pendingBridgeTransactions, setPendingBridgeTransactions] =
    useState<BridgeState>(defaultBridgeState)

  useEffect(() => {
    ;(async () => {
      await loadInitialStatesFromStorage()
      setInitialized(true)
    })()
  }, [])

  const setSetting = (setting: Setting, value: SettingValue) => {
    const updatedSettings = new Map(userSettings)
    updatedSettings.set(setting, value)
    setUserSettings(updatedSettings)
    StorageTools.saveMapToStorage(USER_SETTINGS, updatedSettings).catch(
      reason => console.error(reason)
    )
  }

  const getSetting = useCallback(
    (setting: Setting) => {
      return userSettings.get(setting)
    },
    [userSettings]
  )

  const saveAddressBook = (addrBook: Map<UID, Contact>) => {
    setAddressBook(new Map(addrBook))
    StorageTools.saveMapToStorage(ADDR_BOOK, addrBook).catch(reason =>
      console.error(reason)
    )
  }

  const saveNfts = (nfts: Map<UID, NFTItemData>) => {
    setNfts(new Map(nfts))
    StorageTools.saveMapToStorage(NFTs, nfts).catch(reason =>
      console.error(reason)
    )
  }

  const saveCustomTokens = (tokens: CustomTokens) => {
    setCustomTokens(tokens)
    return StorageTools.saveToStorage<CustomTokens>(CUSTOM_TOKENS, tokens)
  }

  const addToRecentContacts = (contact: RecentContact) => {
    const newRecents = [
      contact,
      ...recentContacts.filter(value => value.id !== contact.id)
    ].slice(0, 9) //save max 10 recents
    setRecentContacts(newRecents)
    StorageTools.saveToStorage(ADDR_BOOK_RECENTS, newRecents).catch(reason =>
      console.error(reason)
    )
  }

  const saveWatchlistFavorites = (favorites: string[]) => {
    setWatchlistFavorites([...favorites])
    StorageTools.saveToStorage(WATCHLIST_FAVORITES, favorites).catch(reason =>
      console.error(reason)
    )
  }

  const saveViewOnceInformation = (info: ViewOnceInformation[]) => {
    // we use set so we don't allow duplicates
    const infoSet = [...new Set(info)]
    setViewOnceInfo(infoSet)
    StorageTools.saveToStorage(VIEW_ONCE_INFORMATION, infoSet).catch(error =>
      console.error(error)
    )
  }

  const savePendingBridgeTransactions = (pendingTransactions: BridgeState) => {
    setPendingBridgeTransactions(pendingTransactions)
    StorageTools.saveToStorage(
      PENDING_BRIDGE_TRANSACTIONS,
      pendingTransactions
    ).catch(error => console.error(error))
  }

  const infoHasBeenShown = (info: ViewOnceInformation) => {
    return viewOnceInfo.includes(info)
  }

  /**
   * Clear hook states
   */
  const flush = () => {
    setAddressBook(new Map())
    setNfts(new Map())
    setRecentContacts([])
    setWatchlistFavorites([])
    setCustomTokens({})
    setUserSettings(new Map())
    setPendingBridgeTransactions(defaultBridgeState)
    setInitialized(false)
  }

  async function loadInitialStatesFromStorage() {
    setUserSettings(
      await StorageTools.loadFromStorageAsMap<Setting, SettingValue>(
        USER_SETTINGS
      )
    )
    setNfts(await StorageTools.loadFromStorageAsMap<UID, NFTItemData>(NFTs))
    setAddressBook(
      await StorageTools.loadFromStorageAsMap<UID, Contact>(ADDR_BOOK)
    )
    setRecentContacts(
      await StorageTools.loadFromStorageAsArray<RecentContact>(
        ADDR_BOOK_RECENTS
      )
    )
    setWatchlistFavorites(
      await StorageTools.loadFromStorageAsArray<string>(WATCHLIST_FAVORITES)
    )
    setCustomTokens(
      (await StorageTools.loadFromStorageAsObj<CustomTokens>(CUSTOM_TOKENS)) ??
        {}
    )
    setViewOnceInfo(
      await StorageTools.loadFromStorageAsArray<ViewOnceInformation>(
        VIEW_ONCE_INFORMATION
      )
    )
    StorageTools.loadFromStorageAsObj<BridgeState>(
      PENDING_BRIDGE_TRANSACTIONS
    ).then(value => {
      setPendingBridgeTransactions(
        value && 'bridgeTransactions' in value
          ? (value as BridgeState)
          : defaultBridgeState
      )
    })
  }

  return {
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
    pendingBridgeTransactions: {
      pendingBridgeTransactions: pendingBridgeTransactions,
      savePendingBridgeTransactions: savePendingBridgeTransactions
    },
    flush,
    initialized
  }
}
