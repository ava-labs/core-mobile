import React, { FC, memo } from 'react'
import {
  useTheme,
  View,
  Text,
  Icons,
  TouchableOpacity
} from '@avalabs/k2-alpine'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { AmountIndicator } from 'common/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'

type Props = {
  title: string
  subtitle: string
  icon?: React.JSX.Element
  index: number
  isLastItem: boolean
  amountIndicator: AmountIndicator
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({
  title,
  subtitle,
  icon,
  onPress,
  isLastItem,
  amountIndicator,
  index
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const textColor =
    amountIndicator === AmountIndicator.Up
      ? '#47C4AF'
      : amountIndicator === AmountIndicator.Down
      ? colors.$textDanger
      : colors.$textSecondary

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <TouchableOpacity
        onPress={onPress}
        sx={{ overflow: 'visible' }}
        testID="activityListItem">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            paddingHorizontal: 16
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
            <Icons.Custom.Outbound />
          </View>
        </View>
        {!isLastItem && (
          <View
            sx={{
              height: 1,
              backgroundColor: '$borderPrimary',
              marginTop: 14,
              marginBottom: 9,
              marginLeft: 63
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export default memo(ActivityListItem)
