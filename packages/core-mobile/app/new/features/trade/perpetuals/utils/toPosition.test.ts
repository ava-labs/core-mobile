import type { UserFill } from '@avalabs/perps-sdk'
import { toPositionEntry, toRecentCoinEntries } from './toPosition'

const fill = (overrides: Partial<UserFill> = {}): UserFill => ({
  closedPnl: '0',
  coin: 'ETH',
  crossed: false,
  dir: 'Open Long',
  hash: '0xabc',
  oid: 1,
  px: '63.06',
  side: 'B',
  startPosition: '0',
  sz: '0.0714',
  time: 1752969420000,
  tid: 100,
  ...overrides
})

describe('toRecentCoinEntries', () => {
  it('returns only fills for the requested coin', () => {
    const fills = [
      fill({ coin: 'ETH', tid: 1 }),
      fill({ coin: 'BTC', tid: 2 }),
      fill({ coin: 'ETH', tid: 3 })
    ]
    const entries = toRecentCoinEntries(fills, 'ETH', 5)
    expect(entries).toHaveLength(2)
    expect(entries.every(e => e.coin === 'ETH')).toBe(true)
  })

  it('caps the result at limit, keeping input (newest-first) order', () => {
    const fills = [1, 2, 3, 4, 5, 6, 7].map(n =>
      fill({ tid: n, hash: `0x${n}` })
    )
    const entries = toRecentCoinEntries(fills, 'ETH', 5)
    expect(entries).toHaveLength(5)
    expect(entries.map(e => e.id)).toEqual([
      '0x1-1',
      '0x2-2',
      '0x3-3',
      '0x4-4',
      '0x5-5'
    ])
  })

  it('matches the full coin key so HIP-3 markets do not collide with native tickers', () => {
    const fills = [fill({ coin: 'xyz:GOLD', tid: 1 }), fill({ coin: 'GOLD', tid: 2 })]
    const entries = toRecentCoinEntries(fills, 'xyz:GOLD', 5)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.coin).toBe('xyz:GOLD')
  })

  it('returns an empty array when no fills match', () => {
    expect(toRecentCoinEntries([fill({ coin: 'BTC' })], 'ETH', 5)).toEqual([])
    expect(toRecentCoinEntries([], 'ETH', 5)).toEqual([])
  })
})

describe('toPositionEntry date labels', () => {
  it('leaves dateLabel empty for fills from today (time-only row)', () => {
    const entry = toPositionEntry(fill({ time: Date.now() }))
    expect(entry.dateLabel).toBe('')
    expect(entry.timeLabel).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
  })

  it("labels fills from the previous day 'Yesterday'", () => {
    const entry = toPositionEntry(
      fill({ time: Date.now() - 24 * 60 * 60 * 1000 })
    )
    expect(entry.dateLabel).toBe('Yesterday')
  })

  it('labels older fills MM/dd/yy', () => {
    const entry = toPositionEntry(fill({ time: 1752969420000 }))
    expect(entry.dateLabel).toMatch(/^\d{2}\/\d{2}\/\d{2}$/)
  })
})
