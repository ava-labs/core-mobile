import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export type ChannelId = 'stakeComplete'

export interface AvaxAndroidChannel extends AndroidChannel {
  id: ChannelId
  title: string
  subtitle: string
  blocked: boolean
}

const notificationChannels = {
  stakeCompleteChannel: {
    id: 'stakeComplete',
    name: 'Staking Complete',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Stake',
    subtitle: 'Staking Complete'
  } as AvaxAndroidChannel
}

export const getAllChannels = () => Object.values(notificationChannels)
