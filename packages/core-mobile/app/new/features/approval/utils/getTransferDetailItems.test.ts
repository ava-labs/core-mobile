import { DetailItemType, Transfer } from '@avalabs/vm-module-types'
import { getTransferDetailItems } from './getTransferDetailItems'

const NOW = 1_800_000_000

const avaxTransfer: Transfer = {
  addresses: ['P-avax1owner'],
  amount: 1_000_000_000n,
  assetId: 'avax-asset-id',
  symbol: 'AVAX',
  decimals: 9,
  isNativeToken: true,
  threshold: 1,
  lockedUntil: 0,
  stakeableLockedUntil: 0
}

const labels = (transfer: Transfer): string[] =>
  getTransferDetailItems(transfer, NOW).map(item => item.label)

describe('getTransferDetailItems', () => {
  it('returns the recipient and amount for AVAX output', () => {
    expect(getTransferDetailItems(avaxTransfer, NOW)).toEqual([
      {
        type: DetailItemType.ADDRESS,
        label: 'To',
        value: 'P-avax1owner'
      },
      {
        type: DetailItemType.CURRENCY,
        label: 'Amount',
        value: 1_000_000_000n,
        maxDecimals: 9,
        symbol: 'AVAX',
        isNativeToken: true
      }
    ])
  })

  it('returns all recipients of a multi-owner output', () => {
    const items = getTransferDetailItems(
      { ...avaxTransfer, addresses: ['P-avax1a', 'P-avax1b'] },
      NOW
    )

    expect(items.slice(0, 2)).toEqual([
      { type: DetailItemType.ADDRESS, label: 'To (1/2)', value: 'P-avax1a' },
      { type: DetailItemType.ADDRESS, label: 'To (2/2)', value: 'P-avax1b' }
    ])
  })

  it('returns an error message when the recipients could not be parsed', () => {
    expect(
      getTransferDetailItems({ ...avaxTransfer, addresses: [] }, NOW)[0]
    ).toEqual({
      type: DetailItemType.TEXT,
      label: 'To',
      value: 'Unknown — unable to parse output',
      alignment: 'horizontal'
    })
  })

  it('returns the currency item for assets where available', () => {
    const items = getTransferDetailItems(
      {
        ...avaxTransfer,
        symbol: 'ANT',
        decimals: 2,
        isNativeToken: false,
        assetName: 'Some Token'
      },
      NOW
    )

    expect(items).toContainEqual(
      expect.objectContaining({
        type: DetailItemType.CURRENCY,
        symbol: 'ANT',
        isNativeToken: false
      })
    )
    expect(items).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Asset',
      value: 'Some Token',
      alignment: 'horizontal'
    })
  })

  it('returns the raw amount and asset id for an unknown asset', () => {
    const items = getTransferDetailItems(
      {
        ...avaxTransfer,
        symbol: undefined,
        decimals: undefined,
        amount: 12345n,
        assetId: 'unknown-asset-id'
      },
      NOW
    )

    expect(items.slice(1)).toEqual([
      {
        type: DetailItemType.TEXT,
        label: 'Amount',
        value: '12345',
        alignment: 'horizontal'
      },
      {
        type: DetailItemType.TEXT,
        label: 'Asset',
        value: 'unknown-asset-id',
        alignment: 'vertical'
      }
    ])
  })

  it('returns the date when staked funds unlock', () => {
    expect(
      getTransferDetailItems(
        { ...avaxTransfer, isStaked: true, stakedUntil: NOW + 100 },
        NOW
      )
    ).toContainEqual({
      type: DetailItemType.DATE,
      label: 'Staked until',
      value: String(NOW + 100)
    })
  })

  it('returns a message for auto-renewed staked funds', () => {
    expect(
      getTransferDetailItems({ ...avaxTransfer, isStaked: true }, NOW)
    ).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Staked',
      value: 'Until the validator stops',
      alignment: 'horizontal'
    })
  })

  it('returns the signature threshold for multi-sig outputs', () => {
    expect(labels(avaxTransfer)).not.toContain('Signatures required')

    expect(
      getTransferDetailItems(
        {
          ...avaxTransfer,
          addresses: ['P-avax1a', 'P-avax1b', 'P-avax1c'],
          threshold: 2
        },
        NOW
      )
    ).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Signatures required',
      value: '2/3',
      alignment: 'horizontal'
    })
  })

  it('returns the signature threshold even if it is 1 for multi-owner outputs', () => {
    expect(
      getTransferDetailItems(
        { ...avaxTransfer, addresses: ['P-avax1a', 'P-avax1b'], threshold: 1 },
        NOW
      )
    ).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Signatures required',
      value: '1/2',
      alignment: 'horizontal'
    })
  })

  it('returns the signature threshold without a total when owners are unknown', () => {
    expect(
      getTransferDetailItems(
        { ...avaxTransfer, addresses: [], threshold: 2 },
        NOW
      )
    ).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Signatures required',
      value: '2',
      alignment: 'horizontal'
    })
  })

  it('returns the dates for locks that have not expired yet', () => {
    const items = getTransferDetailItems(
      {
        ...avaxTransfer,
        lockedUntil: NOW + 1,
        stakeableLockedUntil: NOW + 2
      },
      NOW
    )

    expect(items).toContainEqual({
      type: DetailItemType.DATE,
      label: 'Locked until',
      value: String(NOW + 1)
    })
    expect(items).toContainEqual({
      type: DetailItemType.DATE,
      label: 'Staking only until',
      value: String(NOW + 2)
    })
  })

  it('does not return dates for locks that have already expired', () => {
    expect(
      labels({ ...avaxTransfer, lockedUntil: NOW, stakeableLockedUntil: NOW })
    ).toEqual(['To', 'Amount'])
  })
})
