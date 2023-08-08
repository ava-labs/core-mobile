import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export enum ChannelId {
  STAKING_COMPLETE = 'stakeComplete'
}

export interface AvaxAndroidChannel extends AndroidChannel {
  id: ChannelId
  title: string
  subtitle: string
}

/**
 * This is "database" of all notification channels we are supporting.
 * It should be immutable so use getAllChannels function to get cloned items.
 */
export const notificationChannels = [
  {
    id: ChannelId.STAKING_COMPLETE,
    name: 'Staking Complete',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Stake',
    subtitle: 'Staking Complete'
  } as AvaxAndroidChannel
]
