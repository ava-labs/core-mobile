import * as StoreReview from 'expo-store-review'
import { goToStoreReview } from 'features/appReview/utils/goToStoreReview'

export async function requestInAppReview(options?: {
  fallbackToStore?: boolean
}): Promise<void> {
  const available = await StoreReview.isAvailableAsync()
  if (available) {
    await StoreReview.requestReview()
    return
  }
  if (options?.fallbackToStore) {
    await goToStoreReview()
  }
}
