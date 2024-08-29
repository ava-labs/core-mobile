import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import {
  NotificationsState,
  StakeCompleteNotification
} from 'store/notifications/types'
import { ChannelId } from 'services/notifications/channels'

const reducerName = 'notifications'

const initialState = {
  notificationSubscriptions: {},
  hasPromptedAfterFirstDelegation: false,
  hasPromptedForBalanceChange: false
} as NotificationsState

const notificationsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setNotificationSubscriptions: (
      state,
      action: PayloadAction<[ChannelId, boolean]>
    ) => {
      state.notificationSubscriptions[action.payload[0]] = action.payload[1]
    },
    setHasPromptedAfterFirstDelegation: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.hasPromptedAfterFirstDelegation = action.payload
    },
    setHasPromptedForBalanceChange: (state, action: PayloadAction<boolean>) => {
      state.hasPromptedForBalanceChange = action.payload
    }
  }
})

// selectors
export const selectNotificationSubscription =
  (channelId: ChannelId) => (state: RootState) =>
    state.notifications.notificationSubscriptions[channelId]

export const selectHasPromptedAfterFirstDelegation = (
  state: RootState
): boolean => state.notifications.hasPromptedAfterFirstDelegation

export const selectHasPromptedForBalanceChange = (state: RootState): boolean =>
  state.notifications.hasPromptedForBalanceChange

//actions
export const {
  setNotificationSubscriptions,
  setHasPromptedAfterFirstDelegation,
  setHasPromptedForBalanceChange
} = notificationsSlice.actions

export const maybePromptEarnNotification = createAction(
  `${reducerName}/maybePromptEarnNotification`
)
export const maybePromptBalanceNotification = createAction(
  `${reducerName}/maybePromptBalanceNotification`
)

export const turnOnNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOnNotificationsFor`
)

export const turnOffNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOffNotificationsFor`
)

export const scheduleStakingCompleteNotifications = createAction<
  StakeCompleteNotification[]
>(`${reducerName}/scheduleStakingCompleteNotifications`)

export const notificationsReducer = notificationsSlice.reducer
