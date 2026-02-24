import React, { FC, memo, ReactNode } from 'react'
import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { format, isSameDay } from 'date-fns'
import { getDayString } from 'utils/date/getDayString'

export const NOTIFICATION_LIST_ITEM_HEIGHT = 60

type NotificationListItemProps = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: React.JSX.Element
  rightAccessory?: React.JSX.Element
  accessoryType?: 'chevron' | 'none'
  timestamp?: number
  showSeparator?: boolean
  testID?: string
}

const NotificationListItem: FC<NotificationListItemProps> = ({
  title,
  subtitle,
  icon,
  rightAccessory,
  accessoryType = 'chevron',
  timestamp,
  showSeparator = true,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingLeft: 16
      }}>
      {icon}
      <View
        sx={{
          justifyContent: 'space-between',
          flexDirection: 'row',
          flex: 1,
          alignItems: 'center',
          gap: 6,
          minHeight: NOTIFICATION_LIST_ITEM_HEIGHT,
          paddingTop: 12,
          paddingBottom: 12,
          paddingRight: 10,
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
          {subtitle &&
            (typeof subtitle === 'string' ? (
              <Text
                variant="body2"
                sx={{
                  color: colors.$textSecondary
                }}
                numberOfLines={1}
                ellipsizeMode="tail">
                {subtitle}
              </Text>
            ) : (
              subtitle
            ))}
        </View>
        {rightAccessory}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {timestamp !== undefined && (
            <Text
              variant="body2"
              sx={{ color: colors.$textSecondary, textAlign: 'right' }}>
              {isSameDay(new Date(timestamp), new Date())
                ? format(new Date(timestamp), 'h:mm a')
                : getDayString(timestamp)}
            </Text>
          )}
          {accessoryType === 'chevron' && (
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          )}
        </View>
      </View>
    </View>
  )
}

export default memo(NotificationListItem)
