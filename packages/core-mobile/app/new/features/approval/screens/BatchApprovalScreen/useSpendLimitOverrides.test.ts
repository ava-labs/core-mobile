import { renderHook, act } from '@testing-library/react-hooks'
import { useSpendLimitOverrides } from './useSpendLimitOverrides'

describe('useSpendLimitOverrides', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSpendLimitOverrides())
    expect(result.current.overrides).toEqual({})
  })

  it('sets an override for an index', () => {
    const { result } = renderHook(() => useSpendLimitOverrides())
    act(() => result.current.setOverride(0, '0xabc'))
    expect(result.current.overrides).toEqual({ 0: '0xabc' })
  })

  it('replaces an existing override and leaves others intact', () => {
    const { result } = renderHook(() => useSpendLimitOverrides())
    act(() => result.current.setOverride(0, '0xabc'))
    act(() => result.current.setOverride(1, '0xdef'))
    act(() => result.current.setOverride(0, '0x111'))
    expect(result.current.overrides).toEqual({ 0: '0x111', 1: '0xdef' })
  })

  it('removes an override when passed undefined', () => {
    const { result } = renderHook(() => useSpendLimitOverrides())
    act(() => result.current.setOverride(0, '0xabc'))
    act(() => result.current.setOverride(0, undefined))
    expect(result.current.overrides).toEqual({})
  })
})
