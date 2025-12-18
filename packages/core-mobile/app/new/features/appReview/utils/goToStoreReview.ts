import { Platform } from 'react-native'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'

export async function goToStoreReview(): Promise<void> {
  if (Platform.OS === 'ios') {
    await AppUpdateService.goToAppStore()
    return
  }
  await AppUpdateService.goToPlayStore()
}
