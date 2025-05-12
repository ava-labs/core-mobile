import { AppListenerEffectAPI } from 'store/types'
import { ChannelId } from 'services/notifications/channels'
import { setNotificationSubscriptions } from '../slice'
import { handleStakeCompleteNotificationCleanup } from './handleNotificationCleanup'

export const handleTurnOffNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
): Promise<void> => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, false]))

  if (channelId === ChannelId.STAKING_COMPLETE) {
    handleStakeCompleteNotificationCleanup(listenerApi)
  }
}
