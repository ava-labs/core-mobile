import {
  AddressItem,
  CurrencyItem,
  DateItem,
  DetailItemType,
  TextItem,
  Transfer
} from '@avalabs/vm-module-types'

export type TransferDetailItem =
  | TextItem
  | AddressItem
  | CurrencyItem
  | DateItem

type Until = Transfer['lockedUntil']

const isLocked = (
  until: Until,
  nowInSeconds: number
): until is NonNullable<Until> =>
  until === 'indefinitely' || (until !== undefined && until > nowInSeconds)

const getUntilItem = (
  label: string,
  until: NonNullable<Until>
): TransferDetailItem =>
  until === 'indefinitely'
    ? {
        type: DetailItemType.TEXT,
        label,
        value: 'Indefinitely',
        alignment: 'horizontal'
      }
    : {
        type: DetailItemType.DATE,
        label,
        value: String(until)
      }

const getRecipientItems = (addresses: string[]): TransferDetailItem[] => {
  if (addresses.length === 0) {
    return [
      {
        type: DetailItemType.TEXT,
        label: 'To',
        value: 'Unknown — unable to parse output',
        alignment: 'horizontal'
      }
    ]
  }

  return addresses.map((address, index) => ({
    type: DetailItemType.ADDRESS,
    label:
      addresses.length > 1 ? `To (${index + 1}/${addresses.length})` : 'To',
    value: address
  }))
}

const getAmountItems = ({
  amount,
  assetId,
  symbol,
  decimals,
  isNativeToken
}: Transfer): TransferDetailItem[] => {
  if (symbol !== undefined && decimals !== undefined) {
    return [
      {
        type: DetailItemType.CURRENCY,
        label: 'Amount',
        value: amount,
        maxDecimals: decimals,
        symbol,
        isNativeToken
      }
    ]
  }

  // unknown ANT asset, show raw amount and asset ID
  return [
    {
      type: DetailItemType.TEXT,
      label: 'Amount',
      value: amount.toString(),
      alignment: 'horizontal'
    },
    {
      type: DetailItemType.TEXT,
      label: 'Asset',
      value: assetId,
      alignment: 'vertical'
    }
  ]
}

const getStakeItems = ({
  isStaked,
  stakedUntil
}: Transfer): TransferDetailItem[] => {
  if (!isStaked) {
    return []
  }

  return [
    stakedUntil === undefined
      ? {
          type: DetailItemType.TEXT,
          label: 'Staked',
          value: 'Until the validator stops',
          alignment: 'horizontal'
        }
      : getUntilItem('Staked until', stakedUntil)
  ]
}

const getLockItems = (
  { lockedUntil, stakeableLockedUntil }: Transfer,
  nowInSeconds: number
): TransferDetailItem[] => [
  ...(isLocked(lockedUntil, nowInSeconds)
    ? [getUntilItem('Locked until', lockedUntil)]
    : []),
  ...(isLocked(stakeableLockedUntil, nowInSeconds)
    ? [getUntilItem('Staking only until', stakeableLockedUntil)]
    : [])
]

const getThresholdItems = (
  addresses: string[],
  threshold: number | undefined
): TransferDetailItem[] => {
  if (threshold === undefined || (threshold <= 1 && addresses.length <= 1)) {
    return []
  }

  return [
    {
      type: DetailItemType.TEXT,
      label: 'Signatures required',
      value:
        addresses.length > 0
          ? `${threshold}/${addresses.length}`
          : String(threshold),
      alignment: 'horizontal'
    }
  ]
}

export const getTransferDetailItems = (
  transfer: Transfer,
  nowInSeconds: number
): TransferDetailItem[] => {
  const { addresses, assetName, threshold } = transfer

  return [
    ...getRecipientItems(addresses),
    ...getAmountItems(transfer),
    ...(assetName
      ? [
          {
            type: DetailItemType.TEXT,
            label: 'Asset',
            value: assetName,
            alignment: 'horizontal'
          } as const
        ]
      : []),
    ...getStakeItems(transfer),
    ...getThresholdItems(addresses, threshold),
    ...getLockItems(transfer, nowInSeconds)
  ]
}
