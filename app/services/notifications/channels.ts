import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export type ChannelId = 'stakeComplete'

export interface AvaxAndroidChannel extends AndroidChannel {
  id: ChannelId
  title: string
  subtitle: string
  blocked: boolean
}

/**
 * This is "database" of all notification channels we are supporting.
 * It should be immutable so use getAllChannels function to get cloned items.
 */
const notificationChannels = [
  {
    id: 'stakeComplete',
    name: 'Staking Complete',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Stake',
    subtitle: 'Staking Complete'
  } as AvaxAndroidChannel
]

/**
 * Clones notificationChannels to keep its immutability
 */
export const getAllChannels = () =>
  notificationChannels.map(ch => Object.assign({}, ch))
