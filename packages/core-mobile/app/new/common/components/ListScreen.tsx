import {
  ANIMATED,
  NavigationTitleHeader,
  Separator,
  SPRING_LINEAR_TRANSITION,
  Text
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatListProps,
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView,
  useKeyboardState
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import { ErrorState } from './ErrorState'

// Use this component when you need to display a list of items in a screen.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// It provides:
// - A navigation bar with a title
// - A header with a title
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

// Used by all screens that display a list of items

export interface ListScreenProps<T>
  extends Omit<
    FlatListProps<T>,
    'ListHeaderComponent' | 'ListFooterComponent'
  > {
  /** The title displayed in the screen header */
  title: string
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** Optional title to display in the navigation bar */
  navigationTitle?: string
  /** Array of data items to be rendered in the list */
  data: T[]
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Whether this screen has a tab bar */
  hasTabBar?: boolean
  /** Whether to show the navigation header title */
  showNavigationHeaderTitle?: boolean
  /** Optional function to render a custom sticky header component */
  renderHeader?: () => React.ReactNode
  /** Optional function to render content in the navigation bar's right side */
  renderHeaderRight?: () => React.ReactNode
  /** Optional function to render content when the list is empty */
  renderEmpty?: () => React.ReactNode
  /** Optional background color for the header */
  backgroundColor?: string
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const ListScreen = <T,>({
  data,
  title,
  subtitle,
  navigationTitle,
  hasParent,
  isModal,
  hasTabBar,
  showNavigationHeaderTitle = true,
  backgroundColor,
  renderEmpty,
  renderHeader,
  renderHeaderRight,
  ...rest
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()
  const [targetLayout, setTargetLayout] = useState<
    LayoutRectangle | undefined
  >()

  const titleHeight = useSharedValue<number>(0)
  const subtitleHeight = useSharedValue<number>(0)
  const contentHeaderHeight = useSharedValue<number>(0)
  const renderHeaderHeight = useSharedValue<number>(0)
  const keyboard = useKeyboardState()

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout,
      shouldHeaderHaveGrabber: isModal,
      hideHeaderBackground: true,
      hasSeparator: renderHeader ? false : true,
      backgroundColor,
      hasParent,
      showNavigationHeaderTitle,
      renderHeaderRight
    }
  )

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [
        -titleHeight.value - subtitleHeight.value,
        0,
        titleHeight.value + subtitleHeight.value
      ],
      [0.94, 1, 0.94]
    )
    return {
      opacity: 1 - targetHiddenProgress.value,
      transform: [{ scale: data.length === 0 ? 1 : scale }]
    }
  })

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - targetHiddenProgress.value
    }
  })

  const handleTitleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      titleHeight.value = height
    },
    [titleHeight]
  )

  const handleSubtitleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      subtitleHeight.value = height
    },
    [subtitleHeight]
  )

  const handleRenderHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      renderHeaderHeight.value = height
    },
    [renderHeaderHeight]
  )

  const handleContentHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, x, y, width } = event.nativeEvent.layout
      contentHeaderHeight.value = height
      setTargetLayout({ x, y, width, height: height / 2 })
    },
    [contentHeaderHeight]
  )

  const onScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll(event)
    },
    [onScroll]
  )
  const headerHeight = useHeaderHeight()

  const animatedHeaderContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, contentHeaderHeight.value],
      [0, -contentHeaderHeight.value - (isModal ? 16 : 24)],
      'clamp'
    )

    return {
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity
    }
  })

  const frame = useSafeAreaFrame()

  const contentContainerStyle = useMemo(() => {
    const paddingBottom = keyboard.isVisible
      ? keyboard.height + 16
      : insets.bottom + 16

    return [
      rest?.contentContainerStyle,
      data.length === 0
        ? {
            justifyContent: 'center',
            flex: 1
          }
        : {},
      {
        paddingBottom,
        minHeight:
          frame.height +
          (contentHeaderHeight?.value ?? 0) -
          (renderHeaderHeight?.value ?? 0) +
          // Android formsheet in native-stack has a default top padding of insets.top
          // so we need to add this to adjust the height of the list
          (isModal ? (Platform.OS === 'android' ? insets.top + 8 : -24) : 16)
      }
    ] as StyleProp<ViewStyle>[]
  }, [
    keyboard.isVisible,
    keyboard.height,
    insets.bottom,
    insets.top,
    rest?.contentContainerStyle,
    data.length,
    frame.height,
    contentHeaderHeight?.value,
    renderHeaderHeight?.value,
    isModal
  ])

  const ListHeaderComponent = useMemo(() => {
    return (
      <Animated.View style={[animatedHeaderContainerStyle]}>
        <BlurViewWithFallback
          backgroundColor={backgroundColor}
          style={{
            paddingTop: renderHeader ? headerHeight + 16 : headerHeight,
            paddingBottom: renderHeader ? 12 : 0
          }}>
          <View
            onLayout={handleContentHeaderLayout}
            style={{
              gap: 12,
              paddingHorizontal: 16,
              paddingBottom: 12
            }}>
            {title ? (
              <Animated.View
                onLayout={handleTitleLayout}
                style={[animatedHeaderStyle]}>
                <Text variant="heading2">{title}</Text>
              </Animated.View>
            ) : null}

            {subtitle ? (
              <Animated.View
                onLayout={handleSubtitleLayout}
                style={[animatedSubtitleStyle]}>
                <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
                  {subtitle}
                </Text>
              </Animated.View>
            ) : null}
          </View>
          {renderHeader && (
            <View
              onLayout={handleRenderHeaderLayout}
              style={{
                paddingHorizontal: 16
              }}>
              {renderHeader?.()}
            </View>
          )}
        </BlurViewWithFallback>
        <Animated.View
          style={[
            animatedBorderStyle,
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }
          ]}>
          <Separator />
        </Animated.View>
      </Animated.View>
    )
  }, [
    animatedHeaderContainerStyle,
    backgroundColor,
    renderHeader,
    headerHeight,
    handleContentHeaderLayout,
    title,
    handleTitleLayout,
    animatedHeaderStyle,
    subtitle,
    handleSubtitleLayout,
    animatedSubtitleStyle,
    handleRenderHeaderLayout,
    animatedBorderStyle
  ])

  const ListEmptyComponent = useMemo(() => {
    if (renderEmpty) {
      return <>{renderEmpty()}</>
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="No results"
        description="Try a different search"
      />
    )
  }, [renderEmpty])

  return (
    <Animated.View
      style={[{ flex: 1 }]}
      layout={SPRING_LINEAR_TRANSITION}
      entering={getListItemEnteringAnimation(0)}>
      {/* @ts-expect-error */}
      <AnimatedFlatList
        data={data}
        renderScrollComponent={RenderScrollComponent}
        onScroll={onScrollEvent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        maxToRenderPerBatch={15}
        windowSize={12}
        initialNumToRender={15}
        contentContainerStyle={contentContainerStyle}
        updateCellsBatchingPeriod={50}
        {...rest}
        style={[
          rest.style,
          {
            backgroundColor: backgroundColor ?? 'transparent'
          }
        ]}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
      />
    </Animated.View>
  )
}

const RenderScrollComponent = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />
)
