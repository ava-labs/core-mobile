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

type Props = {
  title: ReactNode
  subtitle: string
  icon?: React.JSX.Element
  status?: PriceChangeStatus
  accessoryType?: 'outbound' | 'chevron'
  onPress?: () => void
  subtitleType: 'amountInCurrency' | 'amountInToken' | 'text'
}

const ActivityListItem: FC<Props> = ({
  title,
  subtitle,
  icon,
  onPress,
  accessoryType = 'outbound',
  status = PriceChangeStatus.Neutral,
  subtitleType
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

  return (
    <TouchableOpacity onPress={onPress} testID="activityListItem">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 9
        }}>
        {icon}
        <View
          sx={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            gap: 8
          }}>
          <View
            sx={{
              alignItems: 'flex-start',
              flex: 1,
              gap: 3
            }}>
            <Text
              variant="body1"
              sx={{ color: '$textPrimary', lineHeight: 15 }}
              numberOfLines={1}
              ellipsizeMode="tail">
              {title}
            </Text>
            {subtitleType === 'text' ? (
              <Text
                variant="body2"
                sx={{
                  color: textColor,
                  lineHeight: 16
                }}
                numberOfLines={1}
                ellipsizeMode="tail">
                {subtitle}
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
            )}
          </View>
          {accessoryType === 'outbound' && (
            <Icons.Custom.Outbound color={colors.$textPrimary} />
          )}
          {accessoryType === 'chevron' && (
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(ActivityListItem)
