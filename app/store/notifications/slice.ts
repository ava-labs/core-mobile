import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { NotificationsState } from 'store/notifications/types'

const reducerName = 'notifications'

const initialState = {
  notifyStakingComplete: false,
  hasPromptedAfterFirstDelegation: false
} as NotificationsState

const notificationsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setNotifyStakingComplete: (state, action: PayloadAction<boolean>) => {
      state.notifyStakingComplete = action.payload
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
export const selectNotifyStakingComplete = (state: RootState) =>
  state.notifications.notifyStakingComplete

export const selectHasPromptedAfterFirstDelegation = (state: RootState) =>
  state.notifications.hasPromptedAfterFirstDelegation

//actions
export const { setNotifyStakingComplete, setHasPromptedAfterFirstDelegation } =
  notificationsSlice.actions

export const maybePromptEarnNotification = createAction(
  `${reducerName}/maybePromptEarnNotification`
)

export const notificationsReducer = notificationsSlice.reducer
