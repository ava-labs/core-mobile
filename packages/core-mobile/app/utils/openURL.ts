import { Linking } from 'react-native'
import Logger from './Logger'

export const openURL = async (url?: string) => {
  if (url === undefined) return

  try {
    const canOpenUrl = await Linking.canOpenURL(url)
    canOpenUrl && Linking.openURL(url)
  } catch (e) {
    Logger.error(`Error opening url: ${url}`)
  }
}
