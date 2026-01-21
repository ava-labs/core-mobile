import * as StoreReview from 'expo-store-review'

export async function requestInAppReview(): Promise<void> {
  const available = await StoreReview.isAvailableAsync()
  if (available) {
    await StoreReview.requestReview()
  }
}
