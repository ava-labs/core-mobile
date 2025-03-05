import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import { Icons } from '../../theme/tokens/Icons'
import { AnimatedText } from '../Animated/AnimatedText'
import { View } from '../Primitives'
import { PriceChange, PriceChangeStatus } from './types'

export const PriceChangeIndicator = ({
  formattedPrice,
  status,
  formattedPercent,
  textVariant = 'buttonSmall'
}: PriceChange & {
  textVariant?: 'buttonMedium' | 'buttonSmall'
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const signIndicator =
    status === PriceChangeStatus.Up
      ? '+'
      : status === PriceChangeStatus.Down
      ? '-'
      : ''
  const iconMarginBottom = textVariant === 'buttonMedium' ? 3 : 2
  const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  return (
    <Animated.View
      exiting={FadeOut}
      entering={FadeIn}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2
        }
      ]}>
      <MaskedView
        maskElement={
          <AnimatedText
            variant={textVariant}
            characters={`${signIndicator}${formattedPrice}`}
          />
        }>
        <View
          style={{
            position: 'relative'
          }}>
          <AnimatedText
            variant={textVariant}
            characters={`${signIndicator}${formattedPrice}`}
          />

          <LinearGradient
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            colors={
              status === PriceChangeStatus.Down
                ? [colors.$accentDanger, colors?.$accentRed]
                : status === PriceChangeStatus.Up
                ? [colors.$accentTeal, theme.colors.$textSuccess]
                : [theme.colors.$textSecondary, theme.colors.$textSecondary]
            }
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
          />
        </View>
      </MaskedView>

      <Animated.View
        layout={LinearTransition.springify().damping(100)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 4
          }
        ]}>
        <View
          sx={{ marginBottom: iconMarginBottom, marginLeft: iconMarginLeft }}>
          {status === PriceChangeStatus.Down ? (
            <Icons.Custom.TrendingArrowDown
              color={colors.$accentDanger}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : status === PriceChangeStatus.Up ? (
            <Icons.Custom.TrendingArrowUp
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.$accentTeal}
            />
          ) : null}
        </View>

        {formattedPercent !== undefined && (
          <AnimatedText
            variant={textVariant}
            characters={formattedPercent}
            sx={{
              color:
                status === PriceChangeStatus.Neutral
                  ? '$textSecondary'
                  : '$textPrimary'
            }}
          />
        )}
      </Animated.View>
    </Animated.View>
  )
}

const ICON_SIZE = 10
