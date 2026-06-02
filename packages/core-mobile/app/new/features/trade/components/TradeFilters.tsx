import {
  alpha,
  AnimatedPressable,
  Chip,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

// Distance (px) over which the right-edge fade interpolates from fully
// visible to fully hidden as the scroll approaches the end.
const FADE_OUT_RANGE = 24

export type TradeFilterChip =
  | string
  | {
      label: string
      renderLeft?: () => JSX.Element
      style?: StyleProp<ViewStyle>
    }

// Pad so the chip doesn't sit flush with the visible edge after a
// pull-into-view. Right pad is wider so the chip clears the fade gradient.
const EDGE_PAD_LEFT = 16
const EDGE_PAD_RIGHT = 16
const FADE_GRADIENT_WIDTH = 42

type ChipLayout = { x: number; width: number }

const getChipLabel = (chip: TradeFilterChip): string =>
  typeof chip === 'string' ? chip : chip.label

export const TradeFilters = ({
  chips,
  selectedChip,
  onSelectChip,
  onSearchPress,
  scrollOffsetRef,
  testID
}: {
  chips: TradeFilterChip[]
  selectedChip: string
  onSelectChip: (chip: string) => void
  onSearchPress?: () => void
  /**
   * Optional parent-owned ref that persists the horizontal scroll offset
   * across remounts. The component reads it once on mount (via the
   * ScrollView's `contentOffset`) and writes the latest offset back on
   * every scroll. Pass a stable `useRef(0)` from the parent so the
   * filter scroll position survives empty/non-empty list switches that
   * unmount the surrounding header.
   */
  scrollOffsetRef?: React.MutableRefObject<number>
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  // Capture the initial offset exactly once so re-renders don't re-apply
  // `contentOffset` and yank the scroll position mid-interaction.
  const [initialScrollX] = useState(() => scrollOffsetRef?.current ?? 0)
  const scrollXRef = useRef(initialScrollX)
  const [containerWidth, setContainerWidth] = useState(0)
  const chipLayoutsRef = useRef<Map<string, ChipLayout>>(new Map())

  // Shared values mirror the JS-side measurements so the gradient opacity
  // can be driven on the UI thread without re-rendering on every scroll.
  const scrollX = useSharedValue(initialScrollX)
  const contentWidthSV = useSharedValue(0)
  const containerWidthSV = useSharedValue(0)

  const updateScrollRefs = useCallback(
    (x: number): void => {
      scrollXRef.current = x
      if (scrollOffsetRef) scrollOffsetRef.current = x
    },
    [scrollOffsetRef]
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      scrollX.value = e.contentOffset.x
      scheduleOnRN(updateScrollRefs, e.contentOffset.x)
    }
  })

  const handleContainerLayout = useCallback(
    (e: LayoutChangeEvent): void => {
      const w = e.nativeEvent.layout.width
      setContainerWidth(w)
      containerWidthSV.value = w
    },
    [containerWidthSV]
  )

  const handleContentSizeChange = useCallback(
    (w: number): void => {
      contentWidthSV.value = w
    },
    [contentWidthSV]
  )

  const gradientStyle = useAnimatedStyle(() => {
    const maxScroll = Math.max(0, contentWidthSV.value - containerWidthSV.value)
    const distanceFromEnd = Math.max(0, maxScroll - scrollX.value)
    return {
      opacity: interpolate(
        distanceFromEnd,
        [0, FADE_OUT_RANGE],
        [0, 1],
        Extrapolation.CLAMP
      )
    }
  })

  const handleChipLayout = useCallback(
    (label: string, e: LayoutChangeEvent): void => {
      const { x, width } = e.nativeEvent.layout
      chipLayoutsRef.current.set(label, { x, width })
    },
    []
  )

  const scrollToChip = useCallback(
    (label: string): void => {
      const layout = chipLayoutsRef.current.get(label)
      if (!layout || containerWidth === 0) return

      const visibleLeft = scrollXRef.current
      // Subtract the fade gradient width so chips sitting under the
      // right-edge fade are treated as clipped, not "fully visible".
      const visibleRight = Math.max(
        visibleLeft,
        visibleLeft + containerWidth - FADE_GRADIENT_WIDTH
      )
      const chipLeft = layout.x
      const chipRight = chipLeft + layout.width

      // Already fully visible within the unobscured viewport — leave
      // the scroll position alone.
      if (chipLeft >= visibleLeft && chipRight <= visibleRight) return

      const target =
        chipLeft < visibleLeft
          ? chipLeft - EDGE_PAD_LEFT
          : chipRight - containerWidth + EDGE_PAD_RIGHT

      scrollViewRef.current?.scrollTo({
        x: Math.max(0, target),
        animated: true
      })
    },
    [containerWidth]
  )

  // Re-scroll to the selected chip whenever the selection changes — this
  // also corrects any parent-driven scroll resets that happen as a side
  // effect of the new filter (e.g. when the filtered list returns no
  // results and the surrounding layout shifts).
  useEffect(() => {
    scrollToChip(selectedChip)
  }, [selectedChip, scrollToChip])

  return (
    <View
      testID={testID}
      style={{
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -16
      }}>
      <View sx={{ flex: 1 }} onLayout={handleContainerLayout}>
        <AnimatedScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          contentOffset={{ x: initialScrollX, y: 0 }}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 8,
            paddingLeft: 16,
            paddingTop: 16,
            paddingBottom: 12,
            paddingRight: 16
          }}>
          {chips.map(chip => {
            const label = getChipLabel(chip)
            const isSelected = label === selectedChip
            const renderLeft =
              typeof chip === 'string' ? undefined : chip.renderLeft
            const style = typeof chip === 'string' ? undefined : chip.style

            return (
              <View key={label} onLayout={e => handleChipLayout(label, e)}>
                <Chip
                  size="large"
                  isSelected={isSelected}
                  onPress={() => onSelectChip(label)}
                  renderLeft={renderLeft}
                  style={style}>
                  {label}
                </Chip>
              </View>
            )
          })}
        </AnimatedScrollView>

        <AnimatedLinearGradient
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 16,
              bottom: 12,
              width: FADE_GRADIENT_WIDTH,
              pointerEvents: 'none'
            },
            gradientStyle
          ]}
          colors={[
            theme.colors.$surfacePrimary,
            alpha(theme.colors.$surfacePrimary, 0)
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      <AnimatedPressable
        onPress={onSearchPress}
        style={{
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 20,
          height: 27,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
          paddingLeft: 10,
          paddingRight: 18,
          marginRight: 16
        }}>
        <Icons.Custom.Search
          color={theme.colors.$textPrimary}
          width={14}
          height={14}
        />
        <Text variant="buttonSmall" sx={{ color: theme.colors.$textSecondary }}>
          Search
        </Text>
      </AnimatedPressable>
    </View>
  )
}
