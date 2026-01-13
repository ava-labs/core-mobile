import { showAlert } from '@avalabs/k2-alpine'
import { appReviewStore } from 'features/appReview/store'
import { promptForAppReviewAfterSuccessfulTransaction } from './promptForAppReviewAfterSuccessfulTransaction'
import { requestInAppReview } from './requestInAppReview'

jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: jest.fn()
}))

jest.mock('features/appReview/store', () => ({
  appReviewStore: {
    getState: jest.fn()
  }
}))

jest.mock('./requestInAppReview', () => ({
  requestInAppReview: jest.fn(() => Promise.resolve())
}))

describe('promptForAppReviewAfterSuccessfulTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(appReviewStore.getState as jest.Mock).mockReturnValue({
      successfulTxCount: 0,
      pendingPrompt: false,
      promptShownCount: 0,
      lastPromptAtMs: undefined,
      declined: false,
      recordSuccessfulTransaction: jest.fn(),
      markPromptShown: jest.fn(),
      decline: jest.fn()
    })
  })

  it('should record transaction and return early if no pending prompt', () => {
    const mockRecord = jest.fn()
    ;(appReviewStore.getState as jest.Mock).mockReturnValue({
      pendingPrompt: false,
      recordSuccessfulTransaction: mockRecord
    })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockRecord).toHaveBeenCalledTimes(1)
    expect(showAlert).not.toHaveBeenCalled()
    expect(requestInAppReview).not.toHaveBeenCalled()
  })

  it('should show alert on first prompt', () => {
    const mockRecord = jest.fn()
    const mockMarkShown = jest.fn()
    ;(appReviewStore.getState as jest.Mock)
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord
      })
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord,
        markPromptShown: mockMarkShown
      })
      .mockReturnValue({
        decline: jest.fn()
      })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockRecord).toHaveBeenCalledTimes(1)
    expect(mockMarkShown).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith({
      title: 'Do you like using Core?',
      buttons: expect.arrayContaining([
        expect.objectContaining({ text: 'Nope' }),
        expect.objectContaining({ text: 'Yes' })
      ])
    })
  })

  it('should request review directly if promptShownCount > 0', () => {
    const mockRecord = jest.fn()
    ;(appReviewStore.getState as jest.Mock)
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 1,
        recordSuccessfulTransaction: mockRecord
      })
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 1,
        recordSuccessfulTransaction: mockRecord
      })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockRecord).toHaveBeenCalledTimes(1)
    expect(showAlert).not.toHaveBeenCalled()
    expect(requestInAppReview).toHaveBeenCalledTimes(1)
    expect(requestInAppReview).toHaveBeenCalledWith()
  })

  it('should call decline when user clicks "Nope"', () => {
    const mockDecline = jest.fn()
    const mockRecord = jest.fn()
    const mockMarkShown = jest.fn()

    ;(appReviewStore.getState as jest.Mock)
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord
      })
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord,
        markPromptShown: mockMarkShown
      })
      .mockReturnValue({
        decline: mockDecline
      })
    ;(showAlert as jest.Mock).mockImplementation(({ buttons }) => {
      const nopeButton = buttons.find(
        (b: { text: string }) => b.text === 'Nope'
      )
      nopeButton?.onPress()
    })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(mockDecline).toHaveBeenCalledTimes(1)
  })

  it('should call requestInAppReview with fallbackToStore when user clicks "Yes"', () => {
    const mockRecord = jest.fn()
    const mockMarkShown = jest.fn()

    ;(appReviewStore.getState as jest.Mock)
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord
      })
      .mockReturnValueOnce({
        pendingPrompt: true,
        promptShownCount: 0,
        recordSuccessfulTransaction: mockRecord,
        markPromptShown: mockMarkShown
      })
      .mockReturnValue({
        decline: jest.fn()
      })
    ;(showAlert as jest.Mock).mockImplementation(({ buttons }) => {
      const yesButton = buttons.find((b: { text: string }) => b.text === 'Yes')
      yesButton?.onPress()
    })

    promptForAppReviewAfterSuccessfulTransaction()

    expect(requestInAppReview).toHaveBeenCalledTimes(1)
    expect(requestInAppReview).toHaveBeenCalledWith({ fallbackToStore: true })
  })
})
