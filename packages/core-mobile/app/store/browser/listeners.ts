import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import Logger from 'utils/Logger'
import { Action } from '@reduxjs/toolkit'
import {
  removeTab,
  clearAllTabs,
  setActiveTabId,
  getLastVisitedTabId,
  addTab,
  getOldestTabId,
  addHistory,
  limitMaxHistory
} from './slice'
import { TabId } from './types'
import { MAXIMUM_TABS } from './const'

const updateActiveTabId = (
  listenerApi: AppListenerEffectAPI,
  tabId: TabId
): void => {
  const browserState = listenerApi.getState().browser
  if (browserState.ids.length === 0) {
    listenerApi.dispatch(clearAllTabs())
    return
  }
  if (browserState.activeTabId === tabId) {
    const lastVisitedTabId = getLastVisitedTabId(browserState)
    if (!lastVisitedTabId) {
      Logger.warn('could not find last visited tab id')
      return
    }
    listenerApi.dispatch(setActiveTabId({ id: lastVisitedTabId }))
  }
}

const keepMaximumAllowedTabs = (
  _: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const browserState = listenerApi.getState().browser
  if (browserState.ids.length > MAXIMUM_TABS) {
    const oldestTabId = getOldestTabId(browserState)
    oldestTabId && listenerApi.dispatch(removeTab({ id: oldestTabId }))
  }
}

const keepMaximumAllowedHistory = (
  listenerApi: AppListenerEffectAPI,
  tabId: TabId
): void => {
  listenerApi.dispatch(limitMaxHistory({ id: tabId }))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const updateActiveTabIdListener = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: removeTab,
    effect: (action, listenerApi) => {
      updateActiveTabId(listenerApi, action.payload.id)
    }
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const limitMaximumTabListener = (startListening: AppStartListening) => {
  startListening({
    actionCreator: addTab,
    effect: keepMaximumAllowedTabs
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const limitMaximumHistoryListener = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: addHistory,
    effect: (action, listenerApi) => {
      keepMaximumAllowedHistory(listenerApi, action.payload.id)
    }
  })
}
