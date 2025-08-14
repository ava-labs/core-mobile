import React, { FC, memo, ReactNode } from 'react'
import {
  Icons,
  PriceChangeStatus,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { BalanceText } from 'common/components/BalanceText'
import { format, isSameDay, isYesterday } from 'date-fns'

type Props = {
  title: ReactNode
  subtitle?: string | null
  icon?: React.JSX.Element
  status?: PriceChangeStatus
  accessoryType?: 'outbound' | 'chevron'
  onPress?: () => void
  subtitleType: 'amountInCurrency' | 'amountInToken' | 'text'
  timestamp?: number
  showSeparator: boolean
  testID?: string
}

export const ACTIVITY_LIST_ITEM_HEIGHT = 60

const ActivityListItem: FC<Props> = ({
  title,
  subtitle,
  icon,
  onPress,
  accessoryType = 'outbound',
  status = PriceChangeStatus.Neutral,
  subtitleType,
  timestamp,
  showSeparator = true,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const textColor =
    status === PriceChangeStatus.Up
      ? '#47C4AF'
      : status === PriceChangeStatus.Down
      ? colors.$textDanger
      : colors.$textSecondary

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)

    if (isSameDay(date, new Date())) {
      // Today: show just time in 12-hour format
      return format(date, 'h:mm a')
    }

    if (isYesterday(date)) {
      // Yesterday: show "Yesterday HH:MM AM/PM"
      return `Yesterday\n${format(date, 'h:mm a')}`
    }

    // Older dates: show "MM/DD/YY HH:MM AM/PM"
    return `${format(date, 'MM/dd/yy')}\n${format(date, 'h:mm a')}`
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        testID={testID}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          paddingLeft: 16
        }}>
        {icon}
        <View
          sx={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            gap: 12,
            minHeight: ACTIVITY_LIST_ITEM_HEIGHT,
            paddingTop: 12,
            paddingBottom: 12,
            paddingRight: 16,
            borderBottomWidth: showSeparator ? 1 : 0,
            borderBottomColor: colors.$borderPrimary
          }}>
          <View
            sx={{
              alignItems: 'flex-start',
              flex: 1,
              gap: 3
            }}>
            <Text
              variant="buttonMedium"
              sx={{
                color: '$textPrimary',
                lineHeight: 15
              }}>
              {title}
            </Text>
            {subtitle ? (
              subtitleType === 'text' ? (
                <Text
                  variant="body2"
                  sx={{
                    color: textColor
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  '{subtitle}'
                </Text>
              ) : (
                <BalanceText
                  variant="body2"
                  sx={{ color: textColor, lineHeight: 16 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  isCurrency={subtitleType === 'amountInCurrency'}
                  maskType="covered">
                  {subtitle}
                </BalanceText>
              )
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {timestamp && (
              <Text
                variant="body2"
                sx={{ color: colors.$textSecondary, textAlign: 'right' }}>
                {formatDate(timestamp)}
              </Text>
            )}
            {accessoryType === 'outbound' && (
              <Icons.Custom.Outbound color={colors.$textPrimary} />
            )}
            {accessoryType === 'chevron' && (
              <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(ActivityListItem)
