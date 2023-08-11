import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import {
  NotificationsState,
  stakeCompleteTriggerData
} from 'store/notifications/types'
import { ChannelId } from 'services/notifications/channels'

const reducerName = 'notifications'

const initialState = {
  notificationSubscriptions: {},
  hasPromptedAfterFirstDelegation: false
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
    }
  }
})

// selectors
export const selectNotificationSubscription =
  (channelId: ChannelId) => (state: RootState) =>
    state.notifications.notificationSubscriptions[channelId]

export const selectHasPromptedAfterFirstDelegation = (state: RootState) =>
  state.notifications.hasPromptedAfterFirstDelegation

//actions
export const {
  setNotificationSubscriptions,
  setHasPromptedAfterFirstDelegation
} = notificationsSlice.actions

export const maybePromptEarnNotification = createAction(
  `${reducerName}/maybePromptEarnNotification`
)

export const turnOnNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOnNotificationsFor`
)

export const turnOffNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOffNotificationsFor`
)

export const createStakingCompleteNotificationTriggers = createAction<
  stakeCompleteTriggerData[]
>(`${reducerName}/createStakingCompleteNotificationTriggers`)

export const notificationsReducer = notificationsSlice.reducer
