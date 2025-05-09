import { Linking } from 'react-native'
import Logger from './Logger'

export const openInSystemBrowser = async (url?: string): Promise<void> => {
  if (url === undefined) return

  try {
    const canOpenUrl = await Linking.canOpenURL(url)
    canOpenUrl && Linking.openURL(url)
  } catch (e) {
    Logger.error(`Error opening url: ${url}`)
  }
}
