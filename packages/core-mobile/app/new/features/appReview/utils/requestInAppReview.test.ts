import * as StoreReview from 'expo-store-review'
import { requestInAppReview } from './requestInAppReview'

jest.mock('expo-store-review')

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
  })
})
