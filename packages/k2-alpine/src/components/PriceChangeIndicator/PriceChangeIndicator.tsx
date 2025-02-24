import React, { useEffect, useState } from 'react'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import Animated, {
  Easing,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'

export const PriceChangeIndicator = ({
  formattedPrice,
  status,
  formattedPercent,
  textVariant = 'buttonSmall'
}: {
  formattedPrice: string
  status: 'up' | 'down' | 'equal'
  formattedPercent?: string
  textVariant?: 'buttonMedium' | 'buttonSmall'
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const signIndicator = status === 'up' ? '+' : status === 'down' ? '-' : ''
  const iconMarginBottom = textVariant === 'buttonMedium' ? 3 : 2
  const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const [price, setPrice] = useState(formattedPrice)

  useEffect(() => {
    animateFooter()
  }, [formattedPrice])

  function animateFooter() {
    'worklet'
    opacity.value = withTiming(
      0,
      { duration: 500, easing: Easing.bezier(0.25, 1, 0.5, 1) },
      () => {
        opacity.value = withTiming(1, {
          duration: 500,
          easing: Easing.bezier(0.25, 1, 0.5, 1)
        })
        runOnJS(setPrice)(formattedPrice)
      }
    )
    scale.value = withSpring(
      0.96,
      { damping: 10, stiffness: 200, mass: 0.5 },
      () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 })
      }
    )
  }

  const footerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }
  })

  return (
    <Animated.View
      exiting={FadeOut}
      style={[
        footerStyle,
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4
        }
      ]}>
      <View sx={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <MaskedView
          maskElement={
            <Text variant={textVariant}>
              {signIndicator}
              {price}
            </Text>
          }>
          <View>
            <Text variant={textVariant} sx={{ opacity: 0 }}>
              {signIndicator}
              {price}
            </Text>
            <LinearGradient
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
              colors={
                status === 'down'
                  ? [colors.$accentRed, colors.$accentDanger]
                  : status === 'up'
                  ? [colors.$accentTeal, theme.colors.$textSuccess]
                  : [theme.colors.$textSecondary, theme.colors.$textSecondary]
              }
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
            />
          </View>
        </MaskedView>
        <View
          sx={{ marginBottom: iconMarginBottom, marginLeft: iconMarginLeft }}>
          {status === 'down' ? (
            <Icons.Custom.TrendingArrowDown
              color={colors.$accentDanger}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : status === 'up' ? (
            <Icons.Custom.TrendingArrowUp
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.$accentTeal}
            />
          ) : null}
        </View>
      </View>
      {formattedPercent !== undefined && (
        <Text
          variant={textVariant}
          sx={{
            color: status === 'equal' ? '$textSecondary' : '$textPrimary'
          }}>
          {formattedPercent}
        </Text>
      )}
    </Animated.View>
  )
}

const ICON_SIZE = 10
