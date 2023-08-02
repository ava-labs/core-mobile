import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { NotificationsState } from 'store/notifications/types'

const reducerName = 'notifications'

const initialState = {
  earnNotificationsEnabled: false,
  hasPromptedAfterFirstDelegation: false
} as NotificationsState

const notificationsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setEarnNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.earnNotificationsEnabled = action.payload
    },
    setHasPromptedAfterFirstDelegation: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.hasPromptedAfterFirstDelegation = action.payload
    }
  }
})

// selectors
export const selectNotificationsEarn = (state: RootState) =>
  state.notifications.earnNotificationsEnabled

export const selectHasPromptedAfterFirstDelegation = (state: RootState) =>
  state.notifications.hasPromptedAfterFirstDelegation

//actions
export const {
  setEarnNotificationsEnabled,
  setHasPromptedAfterFirstDelegation
} = notificationsSlice.actions

export const maybePromptEarnNotification = createAction(
  `${reducerName}/maybePromptEarnNotification`
)

export const notificationsReducer = notificationsSlice.reducer
