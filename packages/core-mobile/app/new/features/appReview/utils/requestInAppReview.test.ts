import * as StoreReview from 'expo-store-review'
import { requestInAppReview } from './requestInAppReview'
import { goToStoreReview } from './goToStoreReview'

jest.mock('expo-store-review')
jest.mock('./goToStoreReview', () => ({
  goToStoreReview: jest.fn(() => Promise.resolve())
}))

describe('requestInAppReview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call requestReview when in-app review is available', async () => {
    ;(StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true)
    ;(StoreReview.requestReview as jest.Mock).mockResolvedValue(undefined)

    await requestInAppReview()

    expect(StoreReview.isAvailableAsync).toHaveBeenCalledTimes(1)
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1)
    expect(goToStoreReview).not.toHaveBeenCalled()
  })

  it('should call goToStoreReview when not available and fallbackToStore is true', async () => {
    ;(StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false)

    await requestInAppReview({ fallbackToStore: true })

    expect(StoreReview.isAvailableAsync).toHaveBeenCalledTimes(1)
    expect(StoreReview.requestReview).not.toHaveBeenCalled()
    expect(goToStoreReview).toHaveBeenCalledTimes(1)
  })

  it('should not call goToStoreReview when not available and fallbackToStore is false', async () => {
    ;(StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false)

    await requestInAppReview({ fallbackToStore: false })

    expect(StoreReview.isAvailableAsync).toHaveBeenCalledTimes(1)
    expect(StoreReview.requestReview).not.toHaveBeenCalled()
    expect(goToStoreReview).not.toHaveBeenCalled()
  })

  it('should not call goToStoreReview when not available and fallbackToStore is undefined', async () => {
    ;(StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false)

    await requestInAppReview()

    expect(StoreReview.isAvailableAsync).toHaveBeenCalledTimes(1)
    expect(StoreReview.requestReview).not.toHaveBeenCalled()
    expect(goToStoreReview).not.toHaveBeenCalled()
  })
})

