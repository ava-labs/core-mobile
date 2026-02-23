import { NavigationTitleHeader, Separator, Text } from '@avalabs/k2-alpine'
import { BlurViewWithFallback } from '@avalabs/k2-alpine/src/components/BlurViewWithFallback/BlurViewWithFallback'
import { useHeaderHeight } from '@react-navigation/elements'
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, {
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollViewProps,
  View,
  ViewStyle
} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
  useKeyboardState
} from 'react-native-keyboard-controller'
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { ErrorState } from './ErrorState'
import Grabber from './Grabber'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'

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
    FlashListProps<T>,
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
  /** Optional function to render a fixed footer at the bottom of the screen */
  renderFooter?: () => React.ReactNode
  /** Whether to show the sticky header */
  shouldShowStickyHeader?: boolean
  /** Optional ref to the flat list */
  flatListRef?: RefObject<ListScreenRef<T>>
}

export type ListScreenRef<T> = {
  scrollViewRef?: RefObject<FlashListRef<T>>
}

export const ListScreenV2 = <T,>({
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
  renderFooter,
  shouldShowStickyHeader = true,
  flatListRef,
  ...props
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const keyboard = useKeyboardState()
  const frame = useSafeAreaFrame()

  const [targetLayout, setTargetLayout] = useState<
    LayoutRectangle | undefined
  >()
  const scrollViewRef = useRef<FlashListRef<T>>(null)

  // Shared values for worklets (UI thread animations)
  const titleHeight = useSharedValue<number>(0)
  const subtitleHeight = useSharedValue<number>(0)

  // State for React re-renders (used in useMemo)
  const [contentHeaderHeight, setContentHeaderHeight] = useState<number>(0)
  const [renderHeaderHeight, setRenderHeaderHeight] = useState<number>(0)
  const [footerHeight, setFooterHeight] = useState<number>(0)
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    if (renderFooter && !showFooter) {
      setShowFooter(true)
    }
  }, [renderFooter, showFooter])

  useImperativeHandle(
    flatListRef,
    () => ({
      scrollViewRef: scrollViewRef as RefObject<FlashListRef<T>>
    }),
    [scrollViewRef]
  )

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout,
      shouldHeaderHaveGrabber: isModal,
      hideHeaderBackground: shouldShowStickyHeader,
      hasSeparator: shouldShowStickyHeader
        ? renderHeader
          ? false
          : true
        : true,
      hasBackgroundAnimation: !shouldShowStickyHeader,
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
      if (event.nativeEvent.contentOffset.y < contentHeaderHeight) {
        if (event.nativeEvent.contentOffset.y > titleHeight.value) {
          scrollViewRef.current?.scrollToOffset({
            offset:
              event.nativeEvent.contentOffset.y > contentHeaderHeight
                ? event.nativeEvent.contentOffset.y
                : contentHeaderHeight,
            animated: true
          })
        } else {
          scrollViewRef.current?.scrollToOffset({
            offset: 0,
            animated: true
          })
        }
      }
    },
    [contentHeaderHeight, titleHeight]
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

  const handleRenderHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setRenderHeaderHeight(height)
  }, [])

  const handleContentHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContentHeaderHeight(height)
  }, [])

  const animatedHeaderContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight],
      Extrapolation.CLAMP
    )

    return {
      zIndex: 10,
      transform: [
        {
          translateY: shouldShowStickyHeader ? translateY : 0
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
      [Platform.OS === 'ios' ? 0.98 : 1, 1, 0.95]
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
      opacity: !shouldShowStickyHeader
        ? 0
        : backgroundColor
        ? targetHiddenProgress.value
        : 1
    }
  })

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity: shouldShowStickyHeader ? opacity : 0
    }
  })

  const animatedListContainer = useAnimatedStyle(() => {
    const top = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight],
      Extrapolation.CLAMP
    )

    const bottom = interpolate(
      scrollY.value,
      [0, headerHeight],
      [-headerHeight, 0],
      Extrapolation.CLAMP
    )

    return {
      flex: 1,
      position: 'absolute',
      top,
      bottom,
      left: 0,
      right: 0
    }
  })

  const minHeight = useMemo(() => {
    const extraPadding = Platform.OS === 'android' ? (isModal ? 24 : 8) : -40

    return (
      frame.height -
      headerHeight -
      contentHeaderHeight -
      renderHeaderHeight -
      extraPadding -
      (keyboard.isVisible ? keyboard.height : 0)
    )
  }, [
    contentHeaderHeight,
    frame.height,
    headerHeight,
    isModal,
    keyboard.height,
    keyboard.isVisible,
    renderHeaderHeight
  ])

  const contentContainerStyle = useMemo(() => {
    // FlashList's contentContainerStyle only supports:
    // backgroundColor, paddingTop, paddingBottom, paddingLeft, paddingRight, padding
    // Do NOT pass minHeight, flex, or other unsupported properties
    return {
      ...((props?.contentContainerStyle as ViewStyle) ?? {}),
      paddingBottom: renderFooter ? footerHeight + 16 : 16
    }
  }, [renderFooter, footerHeight, props?.contentContainerStyle])

  const animatedEmptyComponent = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [-headerHeight, 0],
      Extrapolation.CLAMP
    )

    return {
      minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const renderEmptyComponent = useCallback(() => {
    if (renderEmpty) {
      return renderEmpty()
    }
    return (
      <ErrorState title="No results" description="Try a different search" />
    )
  }, [renderEmpty])

  const ListEmptyComponent = useMemo(() => {
    return (
      <Animated.View style={animatedEmptyComponent}>
        {renderEmptyComponent()}
      </Animated.View>
    )
  }, [animatedEmptyComponent, renderEmptyComponent])

  const renderGrabber = useCallback(() => {
    if (isModal)
      return (
        <View
          style={{
            position: 'absolute',
            top: Platform.OS === 'android' ? 16 : 0,
            left: 0,
            right: 0,
            zIndex: 1000
          }}>
          <Grabber />
        </View>
      )
  }, [isModal])

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setFooterHeight(height)
  }, [])

  const renderHeaderComponent = useCallback(() => {
    return (
      <Animated.View style={[animatedHeaderContainerStyle]}>
        <View
          style={{
            paddingTop: headerHeight + 16,
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
              gap: 6,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    renderHeader,
    headerHeight,
    backgroundColor,
    handleContentHeaderLayout,
    title,
    handleTitleLayout,
    subtitle,
    handleSubtitleLayout,
    handleRenderHeaderLayout
  ])

  const renderFooterContent = useCallback(() => {
    if (renderFooter && showFooter) {
      const footer = renderFooter()
      if (footer) {
        return (
          <LinearGradientBottomWrapper>
            <Animated.View
              entering={FadeIn.delay(150)}
              onLayout={handleFooterLayout}
              style={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 16
              }}>
              {footer}
            </Animated.View>
          </LinearGradientBottomWrapper>
        )
      }
    }
    return null
  }, [renderFooter, showFooter, handleFooterLayout, insets.bottom])

  const overrideProps = useMemo(() => {
    return {
      contentContainerStyle: {
        ...contentContainerStyle,
        minHeight
      }
    }
  }, [contentContainerStyle, minHeight])

  return (
    <Animated.View
      style={[{ flex: 1 }]}
      entering={getListItemEnteringAnimation(0)}>
      {renderHeaderComponent()}

      <View style={{ flex: 1, position: 'relative' }}>
        <Animated.View style={animatedListContainer}>
          <FlashList
            data={data}
            ref={scrollViewRef}
            renderScrollComponent={RenderScrollComponent}
            onScroll={onScrollEvent}
            onScrollEndDrag={onScrollEndDrag}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            overrideProps={overrideProps}
            contentContainerStyle={contentContainerStyle}
            {...props}
            style={{
              backgroundColor: backgroundColor ?? 'transparent',
              ...props.style
            }}
            ListEmptyComponent={ListEmptyComponent}
          />
        </Animated.View>
      </View>

      {renderGrabber()}
      {renderFooterContent()}
    </Animated.View>
  )
}

const RenderScrollComponent = React.forwardRef<
  KeyboardAwareScrollViewRef,
  ScrollViewProps
>((props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />)
