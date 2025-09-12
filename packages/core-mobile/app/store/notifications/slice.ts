import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import {
  NotificationsState,
  StakeCompleteNotification
} from 'store/notifications/types'
import { ChannelId, NewsChannelId } from 'services/notifications/channels'
import { NotificationData } from 'contexts/DeeplinkContext/types'

const reducerName = 'notifications'

const initialState = {
  notificationSubscriptions: {}
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
    }
  }
})

// selectors
export const selectNotificationSubscription =
  (channelId: ChannelId) => (state: RootState) =>
    state.notifications.notificationSubscriptions[channelId]

export const selectEnabledNewsNotificationSubscriptions = (
  state: RootState
): NewsChannelId[] => {
  return Object.entries(state.notifications.notificationSubscriptions).reduce(
    (acc, [channelId, enabled]) => {
      if (
        enabled &&
        channelId !== ChannelId.BALANCE_CHANGES &&
        channelId !== ChannelId.STAKING_COMPLETE
      ) {
        acc.push(channelId as NewsChannelId)
      }
      return acc
    },
    [] as NewsChannelId[]
  )
}

export const selectAllNotificationSubscriptions = (
  state: RootState
): Record<ChannelId, boolean> => state.notifications.notificationSubscriptions

//actions
export const { setNotificationSubscriptions } = notificationsSlice.actions

export const afterLoginFlowsRequested = createAction(
  `${reducerName}/afterLoginFlowsRequested`
)

export const processNotificationData = createAction<{ data: NotificationData }>(
  `${reducerName}/processNotificationData`
)

export const turnOnNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOnNotificationsFor`
)

export const turnOffNotificationsFor = createAction<{ channelId: ChannelId }>(
  `${reducerName}/turnOffNotificationsFor`
)

export const turnOnAllNotifications = createAction(
  `${reducerName}/turnOnAllNotifications`
)

export const onFcmTokenChange = createAction(`${reducerName}/onFcmTokenChange`)

export const scheduleStakingCompleteNotifications = createAction<
  StakeCompleteNotification[]
>(`${reducerName}/scheduleStakingCompleteNotifications`)

export const notificationsReducer = notificationsSlice.reducer
