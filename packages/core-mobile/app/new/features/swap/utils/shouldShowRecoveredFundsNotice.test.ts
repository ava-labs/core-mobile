/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRecoveredAtomicAmount } from '@avalabs/fusion-sdk'
import { shouldShowRecoveredFundsNotice } from './shouldShowRecoveredFundsNotice'

jest.mock('@avalabs/fusion-sdk', () => ({
  getRecoveredAtomicAmount: jest.fn()
}))

const mockGetRecovered = getRecoveredAtomicAmount as jest.Mock
const quote = {} as any

describe('shouldShowRecoveredFundsNotice', () => {
  afterEach(() => jest.clearAllMocks())

  it('is true when the SDK reports a positive recovered amount', () => {
    mockGetRecovered.mockReturnValue(500n)
    expect(shouldShowRecoveredFundsNotice({ quote })).toBe(true)
  })

  it('is false when the SDK reports 0n recovered', () => {
    mockGetRecovered.mockReturnValue(0n)
    expect(shouldShowRecoveredFundsNotice({ quote })).toBe(false)
  })

  it('is false when the SDK returns null (non-CCT quote)', () => {
    mockGetRecovered.mockReturnValue(null)
    expect(shouldShowRecoveredFundsNotice({ quote })).toBe(false)
  })

  it('is false for a null/undefined quote and does not call the SDK', () => {
    expect(shouldShowRecoveredFundsNotice({ quote: null })).toBe(false)
    expect(shouldShowRecoveredFundsNotice({ quote: undefined })).toBe(false)
    expect(mockGetRecovered).not.toHaveBeenCalled()
  })
})
