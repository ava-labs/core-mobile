import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { JsonMap } from 'posthog-react-native/src/bridge'
import { RootState } from 'store'
import { v4 as uuidv4 } from 'uuid'
import { initialState } from './types'

const reducerName = 'posthog'

export const posthogSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    regenerateUserId: state => {
      state.userID = uuidv4()
    },
    toggleAnalytics: (state, action: PayloadAction<boolean>) => {
      const value = action.payload
      state.isAnalyticsEnabled = value
    }
  }
})

// selectors
export const selectUserID = (state: RootState) => state.posthog.userID
export const selectDistinctID = (state: RootState) => state.posthog.distinctID
export const selectIsAnalyticsEnabled = (state: RootState) =>
  state.posthog.isAnalyticsEnabled

// actions
export const { regenerateUserId, toggleAnalytics } = posthogSlice.actions
export const capture = createAction<{ event: string; properties?: JsonMap }>(
  `${reducerName}/capture`
)

export const posthogReducer = posthogSlice.reducer
