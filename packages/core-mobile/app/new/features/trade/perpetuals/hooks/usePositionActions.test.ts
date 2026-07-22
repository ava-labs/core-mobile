import { renderHook } from '@testing-library/react-hooks'
import type { Position } from '../types'
import { usePositionActions } from './usePositionActions'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate })
}))

// Only the fields the hook reads matter; cast to avoid pulling in k2-alpine.
const position = {
  id: 'ETH',
  symbol: 'ETH',
  side: 'long',
  leverage: 40,
  size: 0.05,
  price: 1973.1,
  entryPrice: 1970.4,
  pnl: 12.5,
  takeProfit: 2000,
  stopLoss: 1800
} as unknown as Position

describe('usePositionActions', () => {
  beforeEach(() => mockNavigate.mockClear())

  // notional = size × price; kept as an expression to match the hook exactly.
  const value = 0.05 * 1973.1

  it('builds the market-close URL with the position notional and size', () => {
    const { result } = renderHook(() => usePositionActions())
    result.current.marketClose(position)
    expect(mockNavigate).toHaveBeenCalledWith(
      `/perpetualsClose?kind=market&coin=ETH&side=long&price=1973.1&entry=1970.4&value=${value}&pnl=12.5&size=0.05`
    )
  })

  it('builds the limit-close URL with the position notional and size', () => {
    const { result } = renderHook(() => usePositionActions())
    result.current.limitClose(position)
    expect(mockNavigate).toHaveBeenCalledWith(
      `/perpetualsClose?kind=limit&coin=ETH&side=long&price=1973.1&entry=1970.4&value=${value}&pnl=12.5&size=0.05`
    )
  })

  it('builds the manage URL with size, tp and sl', () => {
    const { result } = renderHook(() => usePositionActions())
    result.current.manage(position)
    expect(mockNavigate).toHaveBeenCalledWith(
      '/perpetualsManage?coin=ETH&side=long&entry=1970.4&leverage=40&size=0.05&pnl=12.5&tp=2000&sl=1800'
    )
  })

  it('falls back to price when entryPrice is absent and url-encodes the coin id', () => {
    const { result } = renderHook(() => usePositionActions())
    result.current.manage({
      ...position,
      id: 'HYPE/USDC',
      symbol: 'HYPE/USDC',
      entryPrice: undefined
    })
    const url = mockNavigate.mock.calls[0]?.[0] as string
    expect(url).toContain('coin=HYPE%2FUSDC')
    expect(url).toContain('entry=1973.1') // entryPrice ?? price
  })

  // HIP-3 positions carry the full namespaced coin in `id` while `symbol` is the
  // dex-stripped display ticker. Routing must use `id` so the close/manage flow
  // targets the builder dex, not the same-ticker main-dex market.
  it('routes HIP-3 positions by the full namespaced coin id, not the ticker', () => {
    const hip3 = {
      ...position,
      id: 'xyz:GOLD',
      symbol: 'GOLD'
    } as unknown as Position
    const { result } = renderHook(() => usePositionActions())

    result.current.marketClose(hip3)
    result.current.manage(hip3)

    const closeUrl = mockNavigate.mock.calls[0]?.[0] as string
    const manageUrl = mockNavigate.mock.calls[1]?.[0] as string
    expect(closeUrl).toContain('coin=xyz%3AGOLD')
    expect(closeUrl).not.toContain('coin=GOLD')
    expect(manageUrl).toContain('coin=xyz%3AGOLD')
  })
})
