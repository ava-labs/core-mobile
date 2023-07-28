import { useEffect, useState } from 'react'
import StorageTools from 'repository/StorageTools'
import Logger from 'utils/Logger'

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 *
 * Suffix "_<increasing number>" is for destructive migration of database. In the future, we want gracefully migrate data with no data loss.
 */
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

export type SettingValue = number | string | boolean | undefined

export type AddrBookItemType = 'account' | 'contact'

export type Repo = {
  informationViewOnceRepo: {
    viewOnceInfo: ViewOnceInformation[]
    infoHasBeenShown: (info: ViewOnceInformation) => boolean
    saveViewOnceInformation: (info: ViewOnceInformation[]) => void
  }
  flush: () => void
  initialized: boolean
}

export function useRepo(): Repo {
  const [initialized, setInitialized] = useState(false)
  const [viewOnceInfo, setViewOnceInfo] = useState<ViewOnceInformation[]>([])

  useEffect(() => {
    ;(async () => {
      await loadInitialStatesFromStorage()
      setInitialized(true)
    })()
  }, [])

  const saveViewOnceInformation = (info: ViewOnceInformation[]) => {
    // we use set so we don't allow duplicates
    const infoSet = [...new Set(info)]
    setViewOnceInfo(infoSet)
    StorageTools.saveToStorage(VIEW_ONCE_INFORMATION, infoSet).catch(error =>
      Logger.error('failed to save to storage', error)
    )
  }

  const infoHasBeenShown = (info: ViewOnceInformation) => {
    return viewOnceInfo.includes(info)
  }

  /**
   * Clear hook states
   */
  const flush = () => {
    setInitialized(false)
  }

  async function loadInitialStatesFromStorage() {
    const initialViewOnceInfoFromStorage =
      await StorageTools.loadFromStorageAsArray<ViewOnceInformation>(
        VIEW_ONCE_INFORMATION
      )

    setViewOnceInfo(initialViewOnceInfoFromStorage)
  }

  return {
    informationViewOnceRepo: {
      viewOnceInfo: viewOnceInfo,
      saveViewOnceInformation,
      infoHasBeenShown
    },
    flush,
    initialized
  }
}
