import type { RootState } from 'store/types'
import { advancedReducer, advancedSlice } from './slice'
import {
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy
} from './slice'
import { initialState, QUICK_SWAPS_DEFAULT } from './types'

const wrap = (advanced: typeof initialState) =>
  ({ settings: { advanced } } as unknown as RootState)

describe('advancedSlice — quickSwaps', () => {
  const { setQuickSwapsEnabled, setQuickSwapsFeeSetting, setQuickSwapsMaxBuy } =
    advancedSlice.actions

  it('starts with QUICK_SWAPS_DEFAULT', () => {
    const state = advancedReducer(undefined, { type: '@@INIT' })
    expect(state.quickSwaps).toEqual(QUICK_SWAPS_DEFAULT)
  })

  it('setQuickSwapsEnabled toggles the flag', () => {
    let state = advancedReducer(undefined, setQuickSwapsEnabled(true))
    expect(state.quickSwaps.isEnabled).toBe(true)
    state = advancedReducer(state, setQuickSwapsEnabled(false))
    expect(state.quickSwaps.isEnabled).toBe(false)
  })

  it('setQuickSwapsFeeSetting writes the fee level', () => {
    const state = advancedReducer(undefined, setQuickSwapsFeeSetting('high'))
    expect(state.quickSwaps.feeSetting).toBe('high')
  })

  it('setQuickSwapsMaxBuy writes the limit value', () => {
    const state = advancedReducer(undefined, setQuickSwapsMaxBuy('5000'))
    expect(state.quickSwaps.maxBuy).toBe('5000')
  })

  it('selectors read from state.settings.advanced.quickSwaps', () => {
    const next = {
      ...initialState,
      quickSwaps: { isEnabled: true, feeSetting: 'low', maxBuy: '10000' }
    } as typeof initialState
    expect(selectIsQuickSwapsEnabled(wrap(next))).toBe(true)
    expect(selectQuickSwapsFeeSetting(wrap(next))).toBe('low')
    expect(selectQuickSwapsMaxBuy(wrap(next))).toBe('10000')
  })
})
