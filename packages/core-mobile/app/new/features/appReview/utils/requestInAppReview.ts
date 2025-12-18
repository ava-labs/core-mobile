import * as StoreReview from 'expo-store-review'
import { goToStoreReview } from 'features/appReview/utils/goToStoreReview'

export async function requestInAppReview(): Promise<void> {
  const available = await StoreReview.isAvailableAsync()
  if (available) {
    await StoreReview.requestReview()
    return
  }
  await goToStoreReview()
}
