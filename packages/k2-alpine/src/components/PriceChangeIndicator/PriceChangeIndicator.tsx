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
import { View, Text } from '../Primitives'
import { K2AlpineTheme } from '../../theme/theme'
import { MaskedView } from '../MaskedView/MaskedView'
import { PriceChangeStatus } from './types'

export const PriceChangeIndicator = ({
  formattedPrice,
  status,
  formattedPercent,
  textVariant = 'buttonSmall',
  animated = false,
  overrideTheme,
  shouldMask = false,
  maskWidth
}: {
  status: PriceChangeStatus
  formattedPercent?: string
  formattedPrice?: string
  shouldHidePrice?: boolean
  textVariant?: TextVariants
  animated?: boolean
  testID?: string
  overrideTheme?: K2AlpineTheme
  shouldMask?: boolean
  maskWidth?: number
}): JSX.Element => {
  const { theme: defaultTheme } = useTheme()
  const theme = overrideTheme ?? defaultTheme

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

  const formattedPriceText = formattedPrice
    ? `${signIndicator}${formattedPrice}`
    : undefined

  const arrowSx = getArrowMargin(textVariant, status, formattedPercent)

  const arrowSize = textVariant === 'priceChangeIndicatorLarge' ? 20 : ICON_SIZE

  if (shouldMask) {
    return (
      <MaskedView
        variant={textVariant}
        sx={{ width: maskWidth, backgroundColor: theme.colors.$borderPrimary }}
      />
    )
  }

  return animated === true ? (
    <AnimatedComponent
      textVariant={textVariant}
      tintColor={tintColor}
      percentChangeColor={percentChangeColor}
      formattedPrice={formattedPriceText}
      formattedPercent={formattedPercent}
      status={status}
      arrowSx={arrowSx}
      arrowSize={arrowSize}
    />
  ) : (
    <PlainComponent
      textVariant={textVariant}
      tintColor={tintColor}
      percentChangeColor={percentChangeColor}
      formattedPrice={formattedPriceText}
      formattedPercent={formattedPercent}
      status={status}
      arrowSx={arrowSx}
      arrowSize={arrowSize}
    />
  )
}

const AnimatedComponent = ({
  textVariant,
  tintColor,
  percentChangeColor,
  formattedPrice,
  formattedPercent,
  status,
  arrowSx,
  arrowSize
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up
  return (
    <Animated.View exiting={FadeOut} entering={FadeIn} style={styles.container}>
      {formattedPrice && (
        <AnimatedText
          variant={textVariant}
          characters={formattedPrice}
          sx={{
            color: tintColor
          }}
        />
      )}
      <Animated.View
        layout={LinearTransition.springify().damping(100)}
        style={styles.innerWrapper}>
        {showArrow && (
          <Animated.View style={styles.arrow}>
            <Arrow sx={arrowSx} status={status} size={arrowSize} />
          </Animated.View>
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
  status,
  arrowSx,
  arrowSize
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up

  return (
    <View style={styles.container}>
      {formattedPrice && (
        <Text
          variant={textVariant}
          sx={{
            color: tintColor
          }}>
          {formattedPrice}
        </Text>
      )}
      <View style={styles.innerWrapper}>
        {showArrow && (
          <View style={styles.arrow}>
            <Arrow sx={arrowSx} status={status} size={arrowSize} />
          </View>
        )}
        {formattedPercent !== undefined && (
          <Text
            variant={textVariant}
            sx={{
              color: percentChangeColor
            }}>
            {formattedPercent}
          </Text>
        )}
      </View>
    </View>
  )
}

const Arrow = ({
  sx,
  status,
  size
}: {
  sx?: SxProp
  status: PriceChangeStatus
  size: number
}): JSX.Element => {
  return (
    <View sx={sx}>
      {status === PriceChangeStatus.Down ? (
        <Icons.Custom.TrendingArrowDown
          color={colors.$accentDanger}
          width={size}
          height={size}
        />
      ) : status === PriceChangeStatus.Up ? (
        <Icons.Custom.TrendingArrowUp
          width={size}
          height={size}
          color={colors.$accentTeal}
        />
      ) : null}
    </View>
  )
}

type ComponentProps = {
  textVariant?: TextVariants
  tintColor: string
  percentChangeColor: string
  formattedPrice: string | undefined
  formattedPercent?: string
  status: PriceChangeStatus
  arrowSx: SxProp
  arrowSize: number
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
  },
  arrow: { alignSelf: 'center' }
})

type TextVariants = 'buttonMedium' | 'buttonSmall' | 'priceChangeIndicatorLarge'

function getArrowMarginBottom(
  textVariant: TextVariants,
  status: PriceChangeStatus
): number {
  if (textVariant === 'priceChangeIndicatorLarge') {
    return 4
  }

  return textVariant === 'buttonMedium'
    ? status === PriceChangeStatus.Up
      ? 3
      : 5
    : 1
}

function getArrowMarginLeft(
  textVariant: TextVariants,
  formattedPercent: string | undefined
): number {
  return formattedPercent === undefined
    ? 4
    : textVariant === 'priceChangeIndicatorLarge'
    ? 5
    : 1
}

function getArrowMarginRight(textVariant: TextVariants): number {
  return textVariant === 'priceChangeIndicatorLarge' ? 4 : 0
}

function getArrowMargin(
  textVariant: TextVariants,
  status: PriceChangeStatus,
  formattedPercent: string | undefined
): SxProp {
  return {
    marginBottom: getArrowMarginBottom(textVariant, status),
    marginLeft: getArrowMarginLeft(textVariant, formattedPercent),
    marginRight: getArrowMarginRight(textVariant)
  }
}
