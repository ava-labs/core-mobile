import { appReviewStore } from 'features/appReview/store'
import { promptForAppReviewAfterSuccessfulTransaction } from './promptForAppReviewAfterSuccessfulTransaction'
import { requestInAppReview } from './requestInAppReview'

jest.mock('./requestInAppReview', () => ({
  requestInAppReview: jest.fn(() => Promise.resolve())
}))

jest.mock('features/appReview/store', () => ({
  appReviewStore: {
    getState: jest.fn()
  }
}))

const mockGetState = appReviewStore.getState as jest.Mock

describe('promptForAppReviewAfterSuccessfulTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should record transaction and return early if no pending prompt', () => {
    const mockRecordSuccessfulTransaction = jest.fn()
    const mockMarkReviewRequested = jest.fn()

    mockGetState.mockReturnValue({
      pendingPrompt: false,
      recordSuccessfulTransaction: mockRecordSuccessfulTransaction,
      markReviewRequested: mockMarkReviewRequested
    })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockRecordSuccessfulTransaction).toHaveBeenCalledTimes(1)
    expect(requestInAppReview).not.toHaveBeenCalled()
  })

  it('should request review directly if pendingPrompt is true', () => {
    const mockRecordSuccessfulTransaction = jest.fn()
    const mockMarkReviewRequested = jest.fn()

    // First call returns state before recording, second call returns state after recording
    mockGetState
      .mockReturnValueOnce({
        pendingPrompt: false,
        recordSuccessfulTransaction: mockRecordSuccessfulTransaction,
        markReviewRequested: mockMarkReviewRequested
      })
      .mockReturnValueOnce({
        pendingPrompt: true,
        recordSuccessfulTransaction: mockRecordSuccessfulTransaction,
        markReviewRequested: mockMarkReviewRequested
      })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockRecordSuccessfulTransaction).toHaveBeenCalledTimes(1)
    expect(requestInAppReview).toHaveBeenCalledTimes(1)
    expect(mockMarkReviewRequested).toHaveBeenCalledTimes(1)
  })
})
