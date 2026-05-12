import type { RootState } from 'store/types'
import {
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy
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
