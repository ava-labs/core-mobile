import {
  NavigationTitleHeader,
  Separator,
  SPRING_LINEAR_TRANSITION,
  Text
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useMemo, useRef, useState } from 'react'
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
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue
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
  /** Optional background color */
  backgroundColor?: string
  /** Whether to show the navigation header title */
  showNavigationHeaderTitle?: boolean
  /** Optional function to render a custom sticky header component */
  renderHeader?: () => React.ReactNode
  /** Optional function to render content in the navigation bar's right side */
  renderHeaderRight?: () => React.ReactNode
  /** Optional function to render content when the list is empty */
  renderEmpty?: () => React.ReactNode
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const ListScreen = <T,>({
  data,
  title,
  subtitle,
  navigationTitle,
  showNavigationHeaderTitle = true,
  hasParent,
  hasTabBar,
  backgroundColor,
  isModal,
  renderEmpty,
  renderHeader,
  renderHeaderRight,
  ...props
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const keyboard = useKeyboardState()
  const frame = useSafeAreaFrame()

  const [targetLayout, setTargetLayout] = useState<
    LayoutRectangle | undefined
  >()
  const scrollViewRef = useRef<FlatList>(null)

  const titleHeight = useSharedValue<number>(0)
  const subtitleHeight = useSharedValue<number>(0)
  const contentHeaderHeight = useSharedValue<number>(0)
  const renderHeaderHeight = useSharedValue<number>(0)

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

  const onScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll(event)
    },
    [onScroll]
  )

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      'worklet'
      if (event.nativeEvent.contentOffset.y < contentHeaderHeight.value) {
        if (event.nativeEvent.contentOffset.y > titleHeight.value) {
          scrollViewRef.current?.scrollToOffset({
            offset:
              event.nativeEvent.contentOffset.y > contentHeaderHeight.value
                ? event.nativeEvent.contentOffset.y
                : contentHeaderHeight.value
          })
        } else {
          scrollViewRef.current?.scrollToOffset({
            offset: 0
          })
        }
      }
    },
    [contentHeaderHeight.value, titleHeight.value]
  )

  const handleTitleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, x, y, width } = event.nativeEvent.layout
      titleHeight.value = height
      setTargetLayout({
        x,
        y,
        width,
        height
      })
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
      const { height } = event.nativeEvent.layout
      contentHeaderHeight.value = height
    },
    [contentHeaderHeight]
  )

  const animatedHeaderContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, contentHeaderHeight.value],
      [0, -contentHeaderHeight.value - (isModal ? 16 : 20)],
      Extrapolation.CLAMP
    )

    return {
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const animatedTitleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [
        -titleHeight.value - subtitleHeight.value,
        0,
        titleHeight.value + subtitleHeight.value
      ],
      [0.95, 1, 0.95]
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

  const animatedHeaderBlurStyle = useAnimatedStyle(() => {
    // if we have a background color, we need to animate the opacity of the blur view
    // so that it blends with the background color after scrolling
    return {
      opacity: backgroundColor ? targetHiddenProgress.value : 1
    }
  })

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity
    }
  })

  const contentContainerStyle = useMemo(() => {
    const paddingBottom = keyboard.isVisible
      ? keyboard.height + 16
      : insets.bottom + 16

    // Android formsheet in native-stack has a default top padding of insets.top
    // so we need to add this to adjust the height of the list
    const extraPadding =
      Platform.OS === 'android'
        ? isModal
          ? insets.top + 16
          : 16
        : isModal
        ? 10
        : 30

    return [
      props?.contentContainerStyle,
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
          extraPadding
      }
    ] as StyleProp<ViewStyle>[]
  }, [
    contentHeaderHeight?.value,
    data.length,
    frame.height,
    insets.bottom,
    insets.top,
    isModal,
    keyboard.height,
    keyboard.isVisible,
    renderHeaderHeight?.value,
    props?.contentContainerStyle
  ])

  const ListHeaderComponent = useMemo(() => {
    return (
      <Animated.View style={[animatedHeaderContainerStyle]}>
        <View
          style={{
            paddingTop: renderHeader ? headerHeight + 16 : headerHeight,
            paddingBottom: renderHeader ? 12 : 0
          }}>
          <Animated.View
            style={[
              animatedHeaderBlurStyle,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }
            ]}>
            <BlurViewWithFallback
              backgroundColor={backgroundColor}
              style={{
                flex: 1
              }}
            />
          </Animated.View>
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
                style={animatedTitleStyle}>
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
        </View>
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
    renderHeader,
    headerHeight,
    animatedHeaderBlurStyle,
    backgroundColor,
    handleContentHeaderLayout,
    title,
    handleTitleLayout,
    animatedTitleStyle,
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
        ref={scrollViewRef}
        renderScrollComponent={RenderScrollComponent}
        onScroll={onScrollEvent}
        onScrollEndDrag={onScrollEndDrag}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        maxToRenderPerBatch={15}
        windowSize={12}
        initialNumToRender={15}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={contentContainerStyle}
        updateCellsBatchingPeriod={50}
        {...props}
        style={[
          props.style,
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
