import React from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native'
import { SxProp } from 'dripsy'
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
  textVariant = 'buttonSmall',
  animated = false
}: PriceChange & {
  textVariant?: 'buttonMedium' | 'buttonSmall'
  animated?: boolean
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()

  const tintColor =
    status === PriceChangeStatus.Down
      ? colors.$accentDanger
      : status === PriceChangeStatus.Up
      ? colors.$accentTeal
      : theme.colors.$textSecondary
  const percentChangeColor =
    status === PriceChangeStatus.Neutral
      ? theme.colors.$textSecondary
      : theme.colors.$textPrimary
  const signIndicator =
    status === PriceChangeStatus.Up
      ? '+'
      : status === PriceChangeStatus.Down
      ? '-'
      : ''

  const formattedPriceText = `${signIndicator}${formattedPrice}`

  return animated === true ? (
    <AnimatedComponent
      textVariant={textVariant}
      tintColor={tintColor}
      percentChangeColor={percentChangeColor}
      formattedPrice={formattedPriceText}
      formattedPercent={formattedPercent}
      status={status}
    />
  ) : (
    <PlainComponent
      textVariant={textVariant}
      tintColor={tintColor}
      percentChangeColor={percentChangeColor}
      formattedPrice={formattedPriceText}
      formattedPercent={formattedPercent}
      status={status}
    />
  )
}

const AnimatedComponent = ({
  textVariant,
  tintColor,
  percentChangeColor,
  formattedPrice,
  formattedPercent,
  status
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up
  const iconMarginBottom =
    textVariant === 'buttonMedium'
      ? status === PriceChangeStatus.Up
        ? 3
        : 5
      : 1
  const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  return (
    <Animated.View exiting={FadeOut} entering={FadeIn} style={styles.container}>
      <AnimatedText
        variant={textVariant}
        characters={formattedPrice}
        sx={{
          color: tintColor
        }}
      />
      <Animated.View
        layout={LinearTransition.springify().damping(100)}
        style={styles.innerWrapper}>
        {showArrow && (
          <Arrow
            sx={{
              marginBottom: iconMarginBottom,
              marginLeft: iconMarginLeft
            }}
            status={status}
          />
        )}
        {formattedPercent !== undefined && (
          <AnimatedText
            variant={textVariant}
            characters={formattedPercent}
            sx={{
              color: percentChangeColor
            }}
          />
        )}
      </Animated.View>
    </Animated.View>
  )
}

const PlainComponent = ({
  textVariant,
  tintColor,
  percentChangeColor,
  formattedPrice,
  formattedPercent,
  status
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up
  const iconMarginBottom =
    textVariant === 'buttonMedium'
      ? status === PriceChangeStatus.Up
        ? 3
        : 5
      : 1
  const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  return (
    <View style={styles.container}>
      <AnimatedText
        variant={textVariant}
        characters={formattedPrice}
        sx={{
          color: tintColor
        }}
      />
      <View style={styles.innerWrapper}>
        {showArrow && (
          <Arrow
            sx={{
              marginBottom: iconMarginBottom,
              marginLeft: iconMarginLeft
            }}
            status={status}
          />
        )}
        {formattedPercent !== undefined && (
          <AnimatedText
            variant={textVariant}
            characters={formattedPercent}
            sx={{
              color: percentChangeColor
            }}
          />
        )}
      </View>
    </View>
  )
}

const Arrow = ({
  sx,
  status
}: {
  sx: SxProp
  status: PriceChangeStatus
}): JSX.Element => {
  return (
    <View sx={sx}>
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
  )
}

type ComponentProps = {
  textVariant?: 'buttonMedium' | 'buttonSmall'
  tintColor: string
  percentChangeColor: string
  formattedPrice: string
  formattedPercent?: string
  status: PriceChangeStatus
}

const ICON_SIZE = 10

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  innerWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4
  }
})
