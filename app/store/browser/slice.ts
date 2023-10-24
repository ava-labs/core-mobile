import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { ActiveTabId, BrowserState } from 'store/browser/types'

const reducerName = 'browser'

const initialState = {
  activeTabId: '' as ActiveTabId
} as BrowserState

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setActiveTabId: (state, action: PayloadAction<ActiveTabId>) => {
      state.activeTabId = action.payload
    }
  }
})

// selectors
export const selectActiveTabId = (state: RootState): string | undefined =>
  state.browser.activeTabId

// actions
export const { setActiveTabId } = browserSlice.actions

export const browserReducer = browserSlice.reducer
