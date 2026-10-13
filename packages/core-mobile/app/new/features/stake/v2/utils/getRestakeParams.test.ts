import { PChainTransaction } from '@avalabs/glacier-sdk'
import { getRestakeParams } from './getRestakeParams'

const DAY = 24 * 60 * 60

const makeTx = (overrides: Partial<PChainTransaction>): PChainTransaction =>
  ({
    nodeId: 'NodeID-A',
    startTimestamp: 1_000_000,
    endTimestamp: 1_000_000 + 14 * DAY,
    amountStaked: [{ amount: '25000000000' }],
    ...overrides
  } as unknown as PChainTransaction)

describe('getRestakeParams', () => {
  it('derives node, summed amount and whole-day duration', () => {
    const tx = makeTx({
      amountStaked: [
        { amount: '25000000000' },
        { amount: '5000000000' }
      ] as PChainTransaction['amountStaked']
    })
    expect(getRestakeParams(tx)).toEqual({
      nodeId: 'NodeID-A',
      amountNAvax: 30000000000n,
      durationDays: 14
    })
  })

  it('rounds the duration to whole days', () => {
    const tx = makeTx({
      endTimestamp: 1_000_000 + 14 * DAY + 13 * 60 * 60 // +13h → rounds up
    })
    expect(getRestakeParams(tx)?.durationDays).toBe(15)
  })

  it.each([
    ['missing nodeId', { nodeId: undefined }],
    ['missing startTimestamp', { startTimestamp: undefined }],
    ['missing endTimestamp', { endTimestamp: undefined }],
    ['zero-day duration', { endTimestamp: 1_000_000 + 60 }],
    ['no staked amount', { amountStaked: [] }]
  ] as const)('returns undefined for %s', (_label, override) => {
    expect(
      getRestakeParams(makeTx(override as Partial<PChainTransaction>))
    ).toBeUndefined()
  })
})
