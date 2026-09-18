import React from 'react'
import { StyleSheet } from 'react-native'
import { SxProp } from 'dripsy'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import { Icons } from '../../theme/tokens/Icons'
import { AnimatedText } from '../Animated/AnimatedText'
import { View, Text } from '../Primitives'
import { K2AlpineTheme } from '../../theme/theme'
import { MaskedView } from '../MaskedView/MaskedView'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { PriceChangeStatus } from './types'

export const PriceChangeIndicator = ({
  formattedPrice,
  status,
  formattedPercent,
  textVariant = 'buttonSmall',
  animated = false,
  overrideTheme,
  shouldMask = false,
  maskWidth,
  signIndicator,
  priceSx,
  percentSx
}: {
  status: PriceChangeStatus
  formattedPercent?: string
  formattedPrice?: string
  signIndicator?: string
  textVariant?: TextVariants
  animated?: boolean
  testID?: string
  overrideTheme?: K2AlpineTheme
  shouldMask?: boolean
  maskWidth?: number
  priceSx?: SxProp
  percentSx?: SxProp
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
  const signIndicatorText =
    status === PriceChangeStatus.Up
      ? '+'
      : status === PriceChangeStatus.Down
      ? '-'
      : ''

  const formattedPriceText = formattedPrice
    ? `${signIndicator ?? signIndicatorText}${formattedPrice}`
    : undefined

  const arrowSx = getArrowMargin(textVariant, formattedPercent)

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
      priceSx={priceSx}
      percentSx={percentSx}
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
      priceSx={priceSx}
      percentSx={percentSx}
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
  arrowSize,
  priceSx,
  percentSx
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up
  return (
    <View style={styles.container}>
      {formattedPrice && (
        <AnimatedText
          variant={textVariant}
          characters={formattedPrice}
          sx={{
            color: tintColor,
            ...priceSx
          }}
        />
      )}
      <View style={styles.innerWrapper}>
        {showArrow && (
          <View style={styles.arrow}>
            <AnimateFadeScale>
              <StatusArrow sx={arrowSx} status={status} size={arrowSize} />
            </AnimateFadeScale>
          </View>
        )}
        {formattedPercent !== undefined && (
          <AnimatedText
            variant={textVariant}
            characters={formattedPercent}
            sx={{
              color: percentChangeColor,
              ...percentSx
            }}
          />
        )}
      </View>
    </View>
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
  arrowSize,
  priceSx,
  percentSx
}: ComponentProps): JSX.Element => {
  const showArrow =
    status === PriceChangeStatus.Down || status === PriceChangeStatus.Up

  return (
    <View style={styles.container}>
      {formattedPrice && (
        <Text
          variant={textVariant}
          sx={{
            color: tintColor,
            ...priceSx
          }}>
          {formattedPrice}
        </Text>
      )}
      <View style={styles.innerWrapper}>
        {showArrow && (
          <View style={styles.arrow}>
            <StatusArrow sx={arrowSx} status={status} size={arrowSize} />
          </View>
        )}
        {formattedPercent !== undefined && (
          <Text
            variant={textVariant}
            sx={{
              color: percentChangeColor,
              ...percentSx
            }}>
            {formattedPercent}
          </Text>
        )}
      </View>
    </View>
  )
}

export const StatusArrow = ({
  sx,
  status,
  size,
  color
}: {
  sx?: SxProp
  status: PriceChangeStatus
  size: number
  color?: string
}): JSX.Element => {
  return (
    <View sx={sx}>
      {status === PriceChangeStatus.Down ? (
        <Icons.Custom.TrendingArrowDown
          color={color ?? colors.$accentDanger}
          width={size}
          height={size}
        />
      ) : status === PriceChangeStatus.Up ? (
        <Icons.Custom.TrendingArrowUp
          width={size}
          height={size}
          color={color ?? colors.$accentTeal}
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
  priceSx?: SxProp
  percentSx?: SxProp
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

type TextVariants =
  | 'buttonMedium'
  | 'buttonSmall'
  | 'priceChangeIndicatorLarge'
  | 'body1'

function getArrowMarginBottom(textVariant: TextVariants): number {
  // The `buttonMedium` / `buttonSmall` margins were a flex-end hack for an
  // earlier layout; now that the arrow's wrapper uses `alignSelf: 'center'`,
  // it lines up with the text glyphs on its own. The large variant still
  // needs a small nudge to sit on its own baseline.
  return textVariant === 'priceChangeIndicatorLarge' ? 4 : 0
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
  formattedPercent: string | undefined
): SxProp {
  return {
    marginBottom: getArrowMarginBottom(textVariant),
    marginLeft: getArrowMarginLeft(textVariant, formattedPercent),
    marginRight: getArrowMarginRight(textVariant)
  }
}
