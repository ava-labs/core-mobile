import React, { FC, useCallback } from 'react'
import { Text } from '@avalabs/k2-alpine'
import { SwapActivityItem as SwapActivityItemType } from '../types'
import { mapTransferToSwapStatus } from '../utils'
import NotificationListItem from './NotificationListItem'
import { SwapIcon } from './SwapIcon'
import { RetryButton } from './RetryButton'

type SwapActivityItemProps = {
  item: SwapActivityItemType
  showSeparator: boolean
  testID?: string
}

/**
 * List item for a swap transaction in the notification center.
 *
 * Title is derived from the item's fromToken / toToken
 */
const SwapActivityItem: FC<SwapActivityItemProps> = ({
  item,
  showSeparator,
  testID
}) => {
  const status = mapTransferToSwapStatus(item.transfer)
  const fromSymbol = item.transfer.sourceAsset.symbol
  const toSymbol = item.transfer.targetAsset.symbol

  const title =
    status === 'completed' || status === 'failed'
      ? `Swapped ${fromSymbol} to ${toSymbol}`
      : `Swapping ${fromSymbol} to ${toSymbol} in progress...`

  const subtitle =
    status === 'completed'
      ? 'Completed'
      : status === 'failed'
      ? 'Failed'
      : 'Tap for more details'

  const accessaryType =
    status === 'completed' || status === 'failed' ? 'none' : 'chevron'

  const renderSubtitle = useCallback(() => {
    return (
      <Text
        variant="body2"
        sx={{
          lineHeight: 22,
          fontWeight: 500,
          color:
            status === 'completed'
              ? '$textSuccess'
              : status === 'failed'
              ? '$textDanger'
              : '$textSecondary'
        }}
        numberOfLines={1}
        ellipsizeMode="tail">
        {subtitle}
      </Text>
    )
  }, [status, subtitle])

  return (
    <NotificationListItem
      title={title}
      subtitle={renderSubtitle()}
      icon={<SwapIcon status={status} />}
      timestamp={status === 'failed' ? undefined : item.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessaryType}
      testID={testID}
      rightAccessory={<RetryButton status={status} item={item} />}
    />
  )
}

export default SwapActivityItem
