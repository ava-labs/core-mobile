import { AppListenerEffectAPI } from 'store'
import { ChannelId } from 'services/notifications/channels'
import { setNotificationSubscriptions } from '../slice'
import { handleStakeCompleteNotificationCleanup } from './handleNotificationCleanup'

export const handleTurnOffNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
) => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, false]))

  if (channelId === ChannelId.STAKING_COMPLETE) {
    handleStakeCompleteNotificationCleanup(listenerApi)
  }
}
