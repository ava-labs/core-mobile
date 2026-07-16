import { NetworkToken } from '@avalabs/core-chains-sdk'
import { PChainTransaction, RewardType } from '@avalabs/glacier-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { getStakeTitle } from './index'

// P-chain AVAX has 9 decimals; amounts below are in nAVAX.
const makeCompletedStake = (rewardAmount?: string): PChainTransaction =>
  ({
    emittedUtxos: rewardAmount
      ? [
          {
            rewardType: RewardType.DELEGATOR,
            asset: { amount: rewardAmount }
          }
        ]
      : []
  } as unknown as PChainTransaction)

const pChainNetworkToken = {
  decimals: 9,
  symbol: 'AVAX'
} as NetworkToken

const title = (rewardAmount?: string): string =>
  getStakeTitle({
    stake: makeCompletedStake(rewardAmount),
    pChainNetworkToken,
    isActive: false
  })

describe('getStakeTitle (completed)', () => {
  it('keeps the familiar two-decimal shape for ordinary rewards', () => {
    expect(title('1750000000')).toBe('1.75 AVAX rewarded')
  })

  it('keeps a minimum of two decimals when trimming trailing zeros', () => {
    expect(title('1200000000')).toBe('1.20 AVAX rewarded')
  })

  it('surfaces dust rewards with up to four decimals instead of "0.00"', () => {
    expect(title('100000')).toBe('0.0001 AVAX rewarded')
  })

  it('shows a zero reward as "0.00"', () => {
    expect(title('0')).toBe('0.00 AVAX rewarded')
  })

  it('falls back to the unknown-amount marker without a reward UTXO', () => {
    expect(title(undefined)).toBe(`${UNKNOWN_AMOUNT} AVAX rewarded`)
  })

  it('pins the four-decimal formatting of sub-decimal rewards', () => {
    // 0.00012345 AVAX — documents TokenUnit's fixedDp behaviour at 4 places.
    expect(title('123450')).toBe('0.0001 AVAX rewarded')
  })
})

describe('getStakeTitle (active)', () => {
  // The remaining-time suffix depends on the current clock, so these assert
  // only the amount prefix — the part this formatting change owns.
  const activeTitle = (estimatedReward?: string): string =>
    getStakeTitle({
      stake: {
        estimatedReward,
        // Far enough out that the stake reads as ongoing.
        endTimestamp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        emittedUtxos: []
      } as unknown as PChainTransaction,
      pChainNetworkToken,
      isActive: true
    })

  it('trims estimated rewards to the familiar two-decimal shape', () => {
    expect(activeTitle('1750000000')).toMatch(/^1\.75 AVAX reward unlocked in /)
  })

  it('surfaces dust estimated rewards with up to four decimals', () => {
    expect(activeTitle('100000')).toMatch(/^0\.0001 AVAX reward unlocked in /)
  })

  it('falls back to the unknown-amount marker without an estimate', () => {
    expect(activeTitle(undefined)).toMatch(
      new RegExp(`^${UNKNOWN_AMOUNT} AVAX reward unlocked in `)
    )
  })
})
