import React, { FC, useMemo } from 'react'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { isUnifiedBridgeTransfer } from 'common/utils/bridgeUtils'
import ActivityListItem from './ActivityListItem'

interface PendingBridgeTransactionItemProps {
  item: BridgeTransaction | BridgeTransfer
  index: number
  onPress: () => void
}

export const PendingBridgeTransactionItem: FC<
  PendingBridgeTransactionItemProps
> = ({ item, index, onPress }) => {
  const {
    theme: { colors }
  } = useTheme()
  const amount = useMemo(() => {
    if (isUnifiedBridgeTransfer(item)) {
      return bigintToBig(item.amount, item.asset.decimals).toString()
    }

    return undefined
  }, [item])

  const symbol = isUnifiedBridgeTransfer(item)
    ? item?.asset.symbol
    : item?.symbol

  return (
    <ActivityListItem
      index={index}
      icon={
        <View
          sx={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '$borderPrimary',
            borderColor: '$borderPrimary'
          }}>
          <Icons.Notification.Sync color={colors.$textPrimary} />
        </View>
      }
      title={`Bridging in progress` + (amount ? `: ${amount} ${symbol}` : '')}
      subtitle="Tap for more details"
      accessoryType="chevron"
      onPress={onPress}
    />
  )
}

const ICON_SIZE = 36
