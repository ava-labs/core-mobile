import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export const stakeCompleteChannel = {
  id: 'stakeComplete',
  name: 'Staking Complete',
  lights: false,
  vibration: false,
  importance: AndroidImportance.DEFAULT
} as AndroidChannel
