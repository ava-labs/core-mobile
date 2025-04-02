import React, { FC, memo } from 'react'
import {
  useTheme,
  View,
  Text,
  Icons,
  TouchableOpacity,
  PriceChangeStatus,
  SPRING_LINEAR_TRANSITION
} from '@avalabs/k2-alpine'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'

type Props = {
  title: string
  subtitle: string
  icon?: React.JSX.Element
  index: number
  status: PriceChangeStatus
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({
  title,
  subtitle,
  icon,
  onPress,
  status,
  index
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
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
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
                flex: 1
              }}>
              <Text
                variant="body1"
                sx={{ color: '$textPrimary', lineHeight: 15 }}
                numberOfLines={1}
                ellipsizeMode="tail">
                {title}
              </Text>
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
            </View>
            <Icons.Custom.Outbound color={colors.$textPrimary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default memo(ActivityListItem)
