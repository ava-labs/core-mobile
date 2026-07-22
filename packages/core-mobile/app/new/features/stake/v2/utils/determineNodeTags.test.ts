import { NodeValidator } from 'types/earn'
import { determineNodeTags } from './determineNodeTags'

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const DAY = 24 * 60 * 60

// Only the fields `determineNodeTags` reads matter; the rest of NodeValidator
// is irrelevant here, so build a minimal partial and cast.
const makeNode = (overrides: Partial<NodeValidator>): NodeValidator =>
  ({
    nodeID: 'NodeID-test',
    uptime: '50',
    delegationFee: '2',
    delegatorCount: '0',
    startTime: String(NOW_SECONDS - 365 * DAY),
    endTime: String(NOW_SECONDS + 365 * DAY),
    ...overrides
  } as unknown as NodeValidator)

describe('determineNodeTags', () => {
  describe('Recommended (uptime ≥ 98% and fee ≤ 2%)', () => {
    it('tags at the threshold', () => {
      expect(
        determineNodeTags(makeNode({ uptime: '98', delegationFee: '2' }))
      ).toContain('Recommended')
    })

    it('does not tag just below the uptime threshold', () => {
      expect(
        determineNodeTags(makeNode({ uptime: '97.99', delegationFee: '2' }))
      ).not.toContain('Recommended')
    })

    it('does not tag when the fee is above 2%', () => {
      expect(
        determineNodeTags(makeNode({ uptime: '99', delegationFee: '2.01' }))
      ).not.toContain('Recommended')
    })
  })

  describe('Popular (delegatorCount ≥ 50)', () => {
    it('tags at the threshold', () => {
      expect(determineNodeTags(makeNode({ delegatorCount: '50' }))).toContain(
        'Popular'
      )
    })

    it('does not tag just below the threshold', () => {
      expect(
        determineNodeTags(makeNode({ delegatorCount: '49' }))
      ).not.toContain('Popular')
    })
  })

  describe('Reliable (uptime ≥ 99.999%)', () => {
    it('tags at 100%', () => {
      expect(determineNodeTags(makeNode({ uptime: '100' }))).toContain(
        'Reliable'
      )
    })

    it('does not tag just below the threshold', () => {
      expect(determineNodeTags(makeNode({ uptime: '99.99' }))).not.toContain(
        'Reliable'
      )
    })
  })

  describe('New (started within the last 7 days)', () => {
    it('tags a validator that started 1 day ago', () => {
      expect(
        determineNodeTags(
          makeNode({ startTime: String(NOW_SECONDS - 1 * DAY) })
        )
      ).toContain('New')
    })

    it('does not tag a validator that started 8 days ago', () => {
      expect(
        determineNodeTags(
          makeNode({ startTime: String(NOW_SECONDS - 8 * DAY) })
        )
      ).not.toContain('New')
    })
  })

  it('orders tags Recommended → Popular → Reliable → New', () => {
    const node = makeNode({
      uptime: '100', // Recommended + Reliable
      delegationFee: '1', // Recommended
      delegatorCount: '100', // Popular
      startTime: String(NOW_SECONDS - 1 * DAY) // New
    })
    expect(determineNodeTags(node)).toEqual([
      'Recommended',
      'Popular',
      'Reliable',
      'New'
    ])
  })

  it('returns no tags for a middling validator', () => {
    expect(
      determineNodeTags(
        makeNode({
          uptime: '90',
          delegationFee: '5',
          delegatorCount: '0',
          startTime: String(NOW_SECONDS - 100 * DAY)
        })
      )
    ).toEqual([])
  })

  it('treats non-numeric fields as not qualifying', () => {
    expect(
      determineNodeTags(
        makeNode({
          uptime: 'n/a',
          delegationFee: 'n/a',
          delegatorCount: 'n/a',
          startTime: 'n/a'
        })
      )
    ).toEqual([])
  })
})
