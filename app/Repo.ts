import { useCallback, useEffect, useState } from 'react'
import StorageTools from 'repository/StorageTools'

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 *
 * Suffix "_<increasing number>" is for destructive migration of database. In the future, we want gracefully migrate data with no data loss.
 */
const USER_SETTINGS = 'USER_SETTINGS'
const VIEW_ONCE_INFORMATION = 'VIEW_ONCE_INFORMATION'

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
  addressBtc: string
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
  const [viewOnceInfo, setViewOnceInfo] = useState<ViewOnceInformation[]>([])
  const [userSettings, setUserSettings] = useState<Map<Setting, SettingValue>>(
    new Map()
  )

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

  const saveViewOnceInformation = (info: ViewOnceInformation[]) => {
    // we use set so we don't allow duplicates
    const infoSet = [...new Set(info)]
    setViewOnceInfo(infoSet)
    StorageTools.saveToStorage(VIEW_ONCE_INFORMATION, infoSet).catch(error =>
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
    setUserSettings(new Map())
    setInitialized(false)
  }

  async function loadInitialStatesFromStorage() {
    setUserSettings(
      await StorageTools.loadFromStorageAsMap<Setting, SettingValue>(
        USER_SETTINGS
      )
    )

    const initialViewOnceInfoFromStorage =
      await StorageTools.loadFromStorageAsArray<ViewOnceInformation>(
        VIEW_ONCE_INFORMATION
      )

    setViewOnceInfo(initialViewOnceInfoFromStorage)
  }

  return {
    userSettingsRepo: {
      setSetting,
      getSetting
    },
    informationViewOnceRepo: {
      viewOnceInfo: viewOnceInfo,
      saveViewOnceInformation,
      infoHasBeenShown
    },
    flush,
    initialized
  }
}
