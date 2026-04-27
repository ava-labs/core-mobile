import React, { FC, useMemo } from 'react'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import ActivityListItem from './ActivityListItem'

interface PendingBridgeTransactionItemProps {
  item: BridgeTransfer
  onPress: () => void
  showSeparator: boolean
}

export const PendingBridgeTransactionItem: FC<
  PendingBridgeTransactionItemProps
> = ({ item, onPress, showSeparator }) => {
  const {
    theme: { colors }
  } = useTheme()
  const amount = useMemo(
    () => bigintToBig(item.amount, item.asset.decimals).toString(),
    [item]
  )

  const symbol = item.asset.symbol

  return (
    <ActivityListItem
      showSeparator={showSeparator}
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
      subtitleType="text"
      accessoryType="chevron"
      onPress={onPress}
    />
  )
}

const ICON_SIZE = 36
