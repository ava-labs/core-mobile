import { AnimatedPressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import Animated, {
  interpolate,
  type ReanimatedKeyframe,
  type SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

const CARD_WIDTH = 160
const CARD_HEIGHT = 240

// Each card's animation starts at a different drag offset (stagger)
const STAGGER_OFFSET = 20
// How much drag (from this card's stagger start) to fully animate out
const CARD_DISMISS_RANGE = 100

const MoreNavigationCard = ({
  item,
  isOpen,
  entering,
  exiting,
  index,
  totalItems,
  dragY
}: {
  item: {
    title: string
    onPress: () => void
  }
  isOpen: boolean
  entering: ReanimatedKeyframe
  exiting: ReanimatedKeyframe
  index: number
  totalItems: number
  dragY: SharedValue<number>
}): JSX.Element => {
  const { theme } = useTheme()

  // Cards at the end animate first (reverse stagger)
  const reverseIndex = totalItems - 1 - index
  const staggerStart = reverseIndex * STAGGER_OFFSET

  const gestureAnimatedStyle = useAnimatedStyle(() => {
    const adjustedDrag = Math.max(0, dragY.value - staggerStart)
    const scale = interpolate(
      adjustedDrag,
      [0, CARD_DISMISS_RANGE],
      [1, 0.7],
      'clamp'
    )
    const opacity = interpolate(
      adjustedDrag,
      [0, CARD_DISMISS_RANGE],
      [1, 0],
      'clamp'
    )

    return {
      transform: [{ scale }],
      opacity
    }
  })

  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      }}>
      {isOpen && (
        <AnimatedPressable
          onPress={item.onPress}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 16
          }}>
          <Animated.View
            entering={entering}
            exiting={exiting}
            style={[
              {
                flex: 1,
                width: '100%',
                height: '100%',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.$borderPrimary,
                backgroundColor: theme.colors.$textPrimary,
                overflow: 'hidden',
                transformOrigin: 'left bottom',
                padding: 16
              },
              gestureAnimatedStyle
            ]}>
            <Text
              variant="heading4"
              style={{ color: theme.colors.$surfacePrimary }}>
              {item.title}
            </Text>
          </Animated.View>
        </AnimatedPressable>
      )}
    </View>
  )
}

export { MoreNavigationCard, CARD_WIDTH, CARD_HEIGHT }
