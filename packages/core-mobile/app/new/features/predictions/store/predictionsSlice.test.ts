import {
  predictionsReducer,
  setKycStatus,
  setActiveQuote,
  setActivePosition,
  setMarkets,
  clearActiveQuote,
  initialState,
  selectKycStatus,
  selectMarkets
} from './predictionsSlice'
import type { KycStatus, MarketSummary } from '../types'

const mockMarket: MarketSummary = {
  tickerId: 'INXD-24-B4900',
  title: 'S&P 500 above 4900?'
}

describe('predictionsSlice', () => {
  it('returns initial state', () => {
    expect(predictionsReducer(undefined, { type: '@@INIT' })).toEqual(
      initialState
    )
  })

  it('setKycStatus updates kycStatus', () => {
    const state = predictionsReducer(undefined, setKycStatus('approved'))
    expect(state.kycStatus).toBe<KycStatus>('approved')
  })

  it('setMarkets stores markets array', () => {
    const state = predictionsReducer(undefined, setMarkets([mockMarket]))
    expect(state.markets).toHaveLength(1)
    expect(state.markets[0]?.tickerId).toBe('INXD-24-B4900')
  })

  it('setActiveQuote stores the quote', () => {
    const quote = { maxBidPrice: '0.71', minAskPrice: '0.73' }
    const state = predictionsReducer(undefined, setActiveQuote(quote))
    expect(state.activeQuote).toEqual(quote)
  })

  it('clearActiveQuote resets to null', () => {
    const quote = { maxBidPrice: '0.71', minAskPrice: '0.73' }
    let state = predictionsReducer(undefined, setActiveQuote(quote))
    state = predictionsReducer(state, clearActiveQuote())
    expect(state.activeQuote).toBeNull()
  })

  it('setActivePosition stores the position', () => {
    const position = { tickerId: 'INXD-24', outcome: 'YES' as const }
    const state = predictionsReducer(undefined, setActivePosition(position))
    expect(state.activePosition).toEqual(position)
  })
})

describe('selectors', () => {
  it('selectKycStatus returns kycStatus from root state', () => {
    const mockRoot = {
      predictions: { ...initialState, kycStatus: 'pending' as KycStatus }
    } as never
    expect(selectKycStatus(mockRoot)).toBe('pending')
  })

  it('selectMarkets returns markets from root state', () => {
    const mockRoot = {
      predictions: { ...initialState, markets: [mockMarket] }
    } as never
    expect(selectMarkets(mockRoot)).toHaveLength(1)
  })
})
