import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import Logger from 'utils/Logger'
import { Action, PayloadAction } from '@reduxjs/toolkit'
import {
  removeTab,
  clearAllTabs,
  setActiveTabId,
  getLastVisitedTabId,
  addTab,
  addHistory,
  limitMaxHistory,
  limitMaxTab,
  removeHistory,
  clearAllHistories,
  setActiveHistoryId,
  getLastVisitedHistoryId
} from './slice'
import { AddHistoryDTO, HistoryDTO, TabDTO } from './types'

const updateActiveTabId = (
  action: PayloadAction<TabDTO>,
  listenerApi: AppListenerEffectAPI
): void => {
  const { id: tabId } = action.payload
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

const updateActiveHistoryId = (
  action: PayloadAction<HistoryDTO>,
  listenerApi: AppListenerEffectAPI
): void => {
  const { id: historyId, tabId } = action.payload
  const browserState = listenerApi.getState().browser
  const historyState = browserState.entities[tabId]?.histories
  if (historyState?.ids.length === 0) {
    listenerApi.dispatch(clearAllHistories({ id: tabId }))
    return
  }
  if (historyState?.activeHistoryId === historyId) {
    const lastVisitedHistoryId = getLastVisitedHistoryId(historyState)
    if (!lastVisitedHistoryId) {
      Logger.warn('could not find last visited history id')
      return
    }
    listenerApi.dispatch(
      setActiveHistoryId({ id: lastVisitedHistoryId, tabId })
    )
  }
}

const keepMaximumAllowedTabs = (
  _: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  listenerApi.dispatch(limitMaxTab())
}

const keepMaximumAllowedHistory = (
  action: PayloadAction<AddHistoryDTO>,
  listenerApi: AppListenerEffectAPI
): void => {
  const { tabId } = action.payload
  listenerApi.dispatch(limitMaxHistory({ id: tabId }))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const updateActiveTabIdListener = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: removeTab,
    effect: updateActiveTabId
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const updateActiveHistoryIdListener = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: removeHistory,
    effect: updateActiveHistoryId
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
    effect: keepMaximumAllowedHistory
  })
}
