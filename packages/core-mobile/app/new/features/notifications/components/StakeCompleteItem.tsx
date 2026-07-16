import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import { StakeCompleteNotificationItem } from '../hooks/useStakeCompleteNotifications'
import NotificationListItem from './NotificationListItem'

const ICON_SIZE = 36

type StakeCompleteItemProps = {
  item: StakeCompleteNotificationItem
  /**
   * Prepended to the subtitle so multi-account/wallet users can tell which
   * account the completed stake belongs to (same convention as
   * `BalanceChangeItem`).
   */
  accountLabel?: string | null
  showSeparator: boolean
  testID?: string
}

const StakeCompleteItem: FC<StakeCompleteItemProps> = ({
  item,
  accountLabel,
  showSeparator,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const baseSubtitle = 'Your staking period has ended'
  const subtitle = accountLabel
    ? `${accountLabel} · ${baseSubtitle}`
    : baseSubtitle

  return (
    <NotificationListItem
      title="Stake complete"
      subtitle={subtitle}
      icon={
        // Same circular container `NotificationIcon` renders; the Database
        // glyph is the staking marker used across the stake surfaces.
        <View
          sx={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE / 2,
            backgroundColor: '$surfaceSecondary',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Icons.Custom.Database color={colors.$textPrimary} />
        </View>
      }
      timestamp={item.timestamp}
      showSeparator={showSeparator}
      accessoryType="chevron"
      testID={testID}
    />
  )
}

export default StakeCompleteItem
