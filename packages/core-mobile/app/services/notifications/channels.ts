import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export enum ChannelId {
  STAKING_COMPLETE = 'stakeComplete',
  BALANCE_CHANGES = 'balanceChanges'
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
  } as AvaxAndroidChannel,
  {
    id: ChannelId.BALANCE_CHANGES,
    name: 'Balance Changes',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Balance',
    subtitle: 'Notifications when your balance changes',
    sound: 'core_receive'
  } as AvaxAndroidChannel
]
