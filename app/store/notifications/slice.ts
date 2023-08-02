import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { NotificationsState } from 'store/notifications/types'

const reducerName = 'notifications'

const initialState = {
  earnNotificationsEnabled: false,
  promptForEarnNotifications: undefined
} as NotificationsState

const notificationsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setEarnNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.earnNotificationsEnabled = action.payload
    },
    setPromptForEarnNotifications: (state, action: PayloadAction<boolean>) => {
      state.promptForEarnNotifications = action.payload
    }
  }
})

// selectors
export const selectNotificationsEarn = (state: RootState) =>
  state.notifications.earnNotificationsEnabled

export const selectPromptForEarnNotifications = (state: RootState) =>
  state.notifications.promptForEarnNotifications

//actions
export const { setEarnNotificationsEnabled, setPromptForEarnNotifications } =
  notificationsSlice.actions

export const delegationSuccess = createAction(
  `${reducerName}/delegationSuccess`
)

export const notificationsReducer = notificationsSlice.reducer
