import {
  alpha,
  AnimatedPressable,
  Icons,
  Separator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { ComponentType, ReactNode, useEffect } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

const CARD_PADDING = 17
const ICON_SIZE = 24
const ICON_GAP = 12

// Opacity applied to a card while it's disabled. Matches the convention
// used elsewhere in the app for the "loading / inactive" feel without
// completely fading the card out.
const DISABLED_OPACITY = 0.5
// Subtle fade between enabled / disabled states so the transition doesn't
// snap when the balance query resolves (or the caller toggles the prop).
const DISABLED_TRANSITION_MS = 200

// Natural size of the ribbon SVG (matches its viewBox).
const RIBBON_W = 93
const RIBBON_H = 91
// The painted flag reaches ~13px short of the SVG's bottom-right corner.
// Pushing the SVG out by MORE than that makes the green band itself poke a
// few px past the card edges, leaving the drop shadow falling outside the
// card (onto the background behind it), per the design.
const RIBBON_OVERHANG = 16

export interface Bullet {
  label: string
  /** Whether the requirement is met. Defaults to true (green check). */
  satisfied?: boolean
}

/**
 * Optional corner-ribbon decoration on a method card. The card itself
 * stays asset-agnostic — the caller passes both the label text and the
 * SVG icon component (e.g. the "EASIEST" flag) — so future ribbons
 * ("FASTEST", "MOST_REWARDS", …) don't require touching this file.
 */
export interface Ribbon {
  label: string
  /**
   * SVG component for the flag shape. Should accept numeric `width` /
   * `height` props (the standard shape produced by
   * `react-native-svg-transformer`).
   */
  Icon: ComponentType<{ width?: number; height?: number }>
}

export interface StakingMethodCardProps {
  icon: ReactNode
  title: string
  subtitle: string
  bullets: Bullet[]
  ribbon?: Ribbon
  onPress: () => void
  /**
   * Disables both the tap and the press animation, and fades the card
   * to {@link DISABLED_OPACITY} (animated). Used while the AVAX balance
   * query is still in flight on the chooser screen.
   */
  disabled?: boolean
}

/**
 * Tappable card used in the V2 staking-method chooser (`StartStakingScreen`).
 * Pairs an icon + title + subtitle row with a separator-delimited bullet
 * list of requirements / call-outs, and optionally a corner ribbon (used
 * for the "EASIEST" badge on the Fast Stake card).
 */
export const StakingMethodCard = ({
  icon,
  title,
  subtitle,
  bullets,
  ribbon,
  onPress,
  disabled = false
}: StakingMethodCardProps): JSX.Element => {
  const { theme } = useTheme()

  // Animated opacity for the disabled state. Initialised at the correct
  // value so the first render doesn't flash, and re-targeted via
  // `withTiming` whenever the `disabled` prop changes — so toggling
  // produces a short fade instead of a snap.
  const disabledOpacity = useSharedValue(disabled ? DISABLED_OPACITY : 1)
  useEffect(() => {
    disabledOpacity.value = withTiming(disabled ? DISABLED_OPACITY : 1, {
      duration: DISABLED_TRANSITION_MS
    })
  }, [disabled, disabledOpacity])
  const animatedDisabledStyle = useAnimatedStyle(() => ({
    opacity: disabledOpacity.value
  }))

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityState={{ disabled }}
      style={[
        {
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 18,
          // No `overflow: hidden`: the EASIEST ribbon's folded tails and
          // drop shadow are designed to extend slightly past the card's
          // edges.
          position: 'relative'
        },
        animatedDisabledStyle
      ]}>
      <View sx={{ padding: CARD_PADDING }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: ICON_GAP
          }}>
          <View
            sx={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            {icon}
          </View>
          <View sx={{ flex: 1, gap: 2 }}>
            <Text variant="heading6">{title}</Text>
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              {subtitle}
            </Text>
          </View>
          <Icons.Navigation.ChevronRightV2
            color={alpha(theme.colors.$textSecondary, 0.6)}
          />
        </View>
        {/* Separator + bullets align with the title column, indented past
            the icon (icon width + gap). The separator bleeds to the card's
            right edge by cancelling the card padding on its right. */}
        <View sx={{ marginLeft: ICON_SIZE + ICON_GAP }}>
          <Separator sx={{ marginVertical: 12, marginRight: -CARD_PADDING }} />
          <View sx={{ gap: 6 }}>
            {bullets.map(bullet => (
              <BulletRow
                key={bullet.label}
                label={bullet.label}
                satisfied={bullet.satisfied ?? true}
              />
            ))}
          </View>
        </View>
      </View>
      {ribbon ? <CornerRibbon label={ribbon.label} Icon={ribbon.Icon} /> : null}
    </AnimatedPressable>
  )
}

const BulletRow = ({
  label,
  satisfied
}: {
  label: string
  satisfied: boolean
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {satisfied ? (
        <Icons.Navigation.Check
          color={theme.colors.$textSuccess}
          width={14}
          height={14}
        />
      ) : (
        <Icons.Custom.RedExclamation width={14} height={14} />
      )}
      <Text variant="body2" sx={{ color: '$textPrimary' }}>
        {label}
      </Text>
    </View>
  )
}

/**
 * Bottom-right corner ribbon. The flag shape (folded tails + drop shadow)
 * comes from the SVG asset the caller provides via the `Icon` prop; the
 * label is overlaid as a rotated RN Text so it uses the app font instead
 * of baked-in vector glyphs.
 */
const CornerRibbon = ({
  label,
  Icon
}: {
  label: string
  Icon: Ribbon['Icon']
}): JSX.Element => {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: -RIBBON_OVERHANG,
        bottom: -RIBBON_OVERHANG,
        width: RIBBON_W,
        height: RIBBON_H
      }}>
      <Icon width={RIBBON_W} height={RIBBON_H} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Text
          // Center of the band sits slightly up-right of the box center;
          // nudge then rotate to sit along the diagonal flag.
          style={{
            color: '#FFFFFF',
            fontSize: 11,
            fontFamily: 'Inter-SemiBold',
            letterSpacing: 0.5,
            transform: [
              { translateX: 6 },
              { translateY: 3 },
              { rotate: '-45deg' }
            ]
          }}>
          {label}
        </Text>
      </View>
    </View>
  )
}
