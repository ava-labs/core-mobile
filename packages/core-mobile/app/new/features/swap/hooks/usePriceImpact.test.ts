import { renderHook, act } from '@testing-library/react-hooks'
import type { LocalTokenWithBalance } from 'store/balance'
import { PriceImpactAvailability } from '../consts'
import type { Quote } from '../types'
import fusionService from '../services/FusionService'
import { usePriceImpact } from './usePriceImpact'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@avalabs/fusion-sdk', () => ({
  ServiceType: {
    MARKR: 'MARKR',
    AVALANCHE_EVM: 'AVALANCHE_EVM',
    WRAP_UNWRAP: 'WRAP_UNWRAP',
    LOMBARD_BTC_TO_BTCB: 'LOMBARD_BTC_TO_BTCB',
    LOMBARD_BTCB_TO_BTC: 'LOMBARD_BTCB_TO_BTC'
  }
}))

jest.mock('../services/FusionService', () => ({
  __esModule: true,
  default: {
    calculatePriceImpactFromQuote: jest.fn()
  }
}))

const mockCalculatePriceImpactFromQuote = jest.mocked(
  fusionService.calculatePriceImpactFromQuote
)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fromToken = { priceInCurrency: 10 } as LocalTokenWithBalance
const toToken = { priceInCurrency: 20 } as LocalTokenWithBalance

const markrQuote = {
  id: 'q-markr',
  serviceType: 'MARKR'
} as unknown as Quote

const avalancheEvmQuote = {
  id: 'q-evm',
  serviceType: 'AVALANCHE_EVM'
} as unknown as Quote

const wrapUnwrapQuote = {
  id: 'q-wrap',
  serviceType: 'WRAP_UNWRAP'
} as unknown as Quote

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
})

describe('usePriceImpact — non-MARKR quotes', () => {
  it.each([
    ['AVALANCHE_EVM', avalancheEvmQuote],
    ['WRAP_UNWRAP', wrapUnwrapQuote]
  ])(
    'does not call the SDK calculator for %s service type',
    async (_, quote) => {
      renderHook(() => usePriceImpact(quote as Quote, fromToken, toToken))
      await act(() => Promise.resolve())
      expect(mockCalculatePriceImpactFromQuote).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['AVALANCHE_EVM', avalancheEvmQuote],
    ['WRAP_UNWRAP', wrapUnwrapQuote]
  ])(
    'returns hidden availability and neutral flags for %s service type',
    async (_, quote) => {
      const { result } = renderHook(() =>
        usePriceImpact(quote as Quote, fromToken, toToken)
      )
      await act(() => Promise.resolve())
      expect(result.current.priceImpactAvailability).toBe(
        PriceImpactAvailability.Hidden
      )
      expect(result.current.isPriceImpactCalculating).toBe(false)
      expect(result.current.isPriceImpactTooHigh).toBe(false)
    }
  )
})

describe('usePriceImpact — missing inputs', () => {
  it('returns hidden availability when quote is undefined', async () => {
    const { result } = renderHook(() =>
      usePriceImpact(undefined, fromToken, toToken)
    )
    await act(() => Promise.resolve())
    expect(result.current.priceImpactAvailability).toBe(
      PriceImpactAvailability.Hidden
    )
    expect(result.current.isPriceImpactCalculating).toBe(false)
    expect(result.current.isPriceImpactTooHigh).toBe(false)
    expect(mockCalculatePriceImpactFromQuote).not.toHaveBeenCalled()
  })
})

describe('usePriceImpact — MARKR quotes', () => {
  it('calls the SDK calculator', async () => {
    mockCalculatePriceImpactFromQuote.mockResolvedValue(200) // 2%
    renderHook(() => usePriceImpact(markrQuote, fromToken, toToken))
    await act(() => Promise.resolve())
    expect(mockCalculatePriceImpactFromQuote).toHaveBeenCalledTimes(1)
  })

  it('returns Ready availability when calculation succeeds', async () => {
    mockCalculatePriceImpactFromQuote.mockResolvedValue(200) // 2%
    const { result } = renderHook(() =>
      usePriceImpact(markrQuote, fromToken, toToken)
    )
    await act(() => Promise.resolve())
    expect(result.current.priceImpactAvailability).toBe(
      PriceImpactAvailability.Ready
    )
    expect(result.current.isPriceImpactCalculating).toBe(false)
    expect(result.current.isPriceImpactTooHigh).toBe(false)
  })
})

describe('usePriceImpact — switching from MARKR to non-MARKR', () => {
  it('immediately returns neutral flags without waiting for the effect to flush', async () => {
    // Calculation starts but never resolves (simulates in-flight request)
    mockCalculatePriceImpactFromQuote.mockReturnValue(
      new Promise(() => {
        // do nothing
      })
    )

    let currentQuote: Quote = markrQuote
    const { result, rerender } = renderHook(() =>
      usePriceImpact(currentQuote, fromToken, toToken)
    )

    // Effect fires — quote is MARKR so we should be in Calculating state
    await act(() => Promise.resolve())
    expect(result.current.isPriceImpactCalculating).toBe(true)

    // Switch to non-MARKR synchronously — isMarkrQuote is derived in the render
    // body, so flags should be false immediately without waiting for the effect
    currentQuote = avalancheEvmQuote
    rerender()

    expect(result.current.isPriceImpactCalculating).toBe(false)
    expect(result.current.isPriceImpactTooHigh).toBe(false)
  })
})
