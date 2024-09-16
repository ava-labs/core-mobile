import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { historyAdapter } from 'store/browser/utils'
import { History } from 'store/browser/types'
import {
  goBackward,
  goForward,
  selectActiveTab,
  updateActiveHistoryForTab
} from './slices/tabs'
import { updateMetadataForHistory } from './slices/globalHistory'
import { updateFavorite } from './slices/favorites'

const updateActiveHistory = (
  action: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const browserAction = isAnyOf(goBackward)(action) ? 'backward' : 'forward'

  const state = listenerApi.getState()
  const activeTab = selectActiveTab(state)
  if (!activeTab) return
  const activeHistoryIndex = activeTab.activeHistoryIndex
  const newActiveHistoryIndex =
    browserAction === 'forward'
      ? activeHistoryIndex + 1
      : activeHistoryIndex - 1
  if (newActiveHistoryIndex === -2) return

  const historyId = activeTab?.historyIds[newActiveHistoryIndex]
  if (newActiveHistoryIndex !== -1 && !historyId) return
  let history: History | undefined
  if (historyId) {
    history = historyAdapter
      .getSelectors()
      .selectById(state.browser.globalHistory, historyId)
  }

  listenerApi.dispatch(
    updateActiveHistoryForTab({
      id: activeTab.id,
      activeHistoryIndex: newActiveHistoryIndex,
      activeHistory: history
    })
  )
}

const updateMetadataForGlobalHistory = ({
  activeHistory,
  listenerApi
}: {
  activeHistory?: History
  listenerApi: AppListenerEffectAPI
}): void => {
  if (activeHistory?.id === undefined) return
  listenerApi.dispatch(
    updateMetadataForHistory({
      id: activeHistory.id,
      favicon: activeHistory?.favicon,
      description: activeHistory?.description
    })
  )
}

const updateMetadataForFavorite = ({
  activeHistory,
  listenerApi
}: {
  activeHistory?: History
  listenerApi: AppListenerEffectAPI
}): void => {
  if (activeHistory?.id === undefined) return
  listenerApi.dispatch(
    updateFavorite({
      id: activeHistory.id,
      favicon: activeHistory?.favicon,
      description: activeHistory?.description,
      title: activeHistory?.title,
    })
  )
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })

  startListening({
    actionCreator: updateActiveHistoryForTab,
    effect: async (action, listenerApi) => {
      updateMetadataForGlobalHistory({
        activeHistory: action.payload.activeHistory,
        listenerApi
      })
    }
  })
  startListening({
    actionCreator: updateActiveHistoryForTab,
    effect: async (action, listenerApi) => {
      updateMetadataForFavorite({
        activeHistory: action.payload.activeHistory,
        listenerApi
      })
    }
  })
}
