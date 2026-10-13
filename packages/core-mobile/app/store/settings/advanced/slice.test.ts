import type { RootState } from 'store/types'
import {
  advancedReducer,
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy,
  setFilterSmallUtxos
} from './slice'
import { initialState } from './types'

const wrap = (advanced: typeof initialState) =>
  ({ settings: { advanced } } as unknown as RootState)

describe('advancedSlice — quickSwaps selectors', () => {
  it('read from state.settings.advanced.quickSwaps', () => {
    const next = {
      ...initialState,
      quickSwaps: { isEnabled: true, feeSetting: 'low', maxBuy: '10000' }
    } as typeof initialState
    expect(selectIsQuickSwapsEnabled(wrap(next))).toBe(true)
    expect(selectQuickSwapsFeeSetting(wrap(next))).toBe('low')
    expect(selectQuickSwapsMaxBuy(wrap(next))).toBe('10000')
  })
})

describe('filterSmallUtxos', () => {
  it('defaults to true', () => {
    expect(initialState.filterSmallUtxos).toBe(true)
  })

  it('setFilterSmallUtxos updates the value', () => {
    const next = advancedReducer(initialState, setFilterSmallUtxos(false))
    expect(next.filterSmallUtxos).toBe(false)
    const back = advancedReducer(next, setFilterSmallUtxos(true))
    expect(back.filterSmallUtxos).toBe(true)
  })
})
