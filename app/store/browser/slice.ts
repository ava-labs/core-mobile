import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { ActiveTabId } from 'store/browser/types'
import { initialState } from './types'

const reducerName = 'browser'

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setActiveTabId: (state, action: PayloadAction<ActiveTabId>) => {
      state.activeTabId = action.payload
    },
    clear: () => initialState
  }
})

// selectors
export const selectActiveTabId = (state: RootState): string | undefined =>
  state.browser.activeTabId

export const clearBrowser = (): { payload: undefined; type: string } =>
  browserSlice.actions.clear()

// actions
export const { setActiveTabId } = browserSlice.actions

export const browserReducer = browserSlice.reducer
