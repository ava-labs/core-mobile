import {
  BlurViewWithFallback,
  NavigationTitleHeader,
  Separator,
  SxProp,
  Text
} from '@avalabs/k2-alpine'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useCallback, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardStickyView
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Grabber from './Grabber'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'
import ScreenHeader from './ScreenHeader'

// Use this component when you need a scrollable screen with proper keyboard handling and header management.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// *** Always use this component for most scrollable screens
// *** All screens are usually scrollable (android won't scroll if the contents are smaller than the screen)
// *** We never display a View as a wrapper, it's always a ScrollView or KeyboardAwareScrollView
// *** If you have an input on the screen, you need to enable keyboard avoiding
// *** Never use a view to wrap your route content, use this instead

// It provides:
// - A navigation bar with a title
// - A header with a title and subtitle
// - A footer with a loading indicator
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

interface ScrollScreenProps extends KeyboardAwareScrollViewProps {
  /** The main title displayed at the top of the screen */
  title?: string
  titleSx?: SxProp
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** The main content to be displayed in the scrollable area */
  children: React.ReactNode
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Whether the screen should adjust its layout when the keyboard appears */
  shouldAvoidKeyboard?: boolean
  /** Whether the screen should avoid the footer when the keyboard appears */
  disableStickyFooter?: boolean
  /** Title to be displayed in the navigation header */
  navigationTitle?: string
  /** Custom header component to be rendered */
  renderHeader?: () => React.ReactNode
  /** Custom footer component to be rendered at the bottom of the screen */
  renderFooter?: () => React.ReactNode
  /** Custom component to be rendered on the right side of the header */
  renderHeaderRight?: () => React.ReactNode
  /** The distance between keyboard and focused TextInput when keyboard is shown. Default is 0. */
  bottomOffset?: number
  /** Whether this screen should show navigation title when scroll. Default is true. */
  showNavigationHeaderTitle?: boolean
  /** Custom style for the header */
  headerStyle?: StyleProp<ViewStyle>
  /** Whether this screen should hide the header background  */
  hideHeaderBackground?: boolean
  /** Overlay component rendered absolutely positioned at the top of the screen over the header area */
  headerCenterOverlay?: React.ReactNode
  /** TestID for the screen */
  testID?: string
  /** Called when the scroll position reaches the end of the content */
  onScrolledToEnd?: (reachedEnd: boolean) => void
}

const KeyboardScrollView = Animated.createAnimatedComponent(
  KeyboardAwareScrollView
)

export const ScrollScreen = ({
  title,
  titleSx,
  subtitle,
  children,
  hasParent,
  isModal,
  navigationTitle,
  shouldAvoidKeyboard,
  disableStickyFooter,
  showNavigationHeaderTitle = true,
  hideHeaderBackground = true,
  headerCenterOverlay,
  headerStyle,
  testID = 'bottom_sheet',
  renderHeader,
  renderFooter,
  renderHeaderRight,
  onScrolledToEnd,
  ...props
}: ScrollScreenProps): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useEffectiveHeaderHeight()

  // scroll to end tracking
  const scrollContentHeight = useRef(0)
  const scrollViewHeight = useRef(0)
  const hasReachedEndRef = useRef(false)

  const SCROLL_END_THRESHOLD = 20

  const checkScrolledToEnd = useCallback(
    (contentOffsetY: number) => {
      if (!onScrolledToEnd || hasReachedEndRef.current) return

      const maxScroll = scrollContentHeight.current - scrollViewHeight.current
      const isAtEnd =
        maxScroll <= 0 || contentOffsetY >= maxScroll - SCROLL_END_THRESHOLD

      if (isAtEnd) {
        hasReachedEndRef.current = true
        onScrolledToEnd(true)
      }
    },
    [onScrolledToEnd]
  )

  const checkScrollableAfterLayout = useCallback(() => {
    if (!onScrolledToEnd) return

    const maxScroll = scrollContentHeight.current - scrollViewHeight.current
    if (maxScroll <= 0 && scrollContentHeight.current > 0) {
      // content doesn't require scroll
      hasReachedEndRef.current = true
      onScrolledToEnd(true)
    }
  }, [onScrolledToEnd])

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      const prevHeight = scrollContentHeight.current
      scrollContentHeight.current = h

      if (!onScrolledToEnd) return

      if (Math.abs(h - prevHeight) > 1) {
        hasReachedEndRef.current = false
        onScrolledToEnd(false)
        checkScrollableAfterLayout()
      }
    },
    [onScrolledToEnd, checkScrollableAfterLayout]
  )

  const handleScrollViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      scrollViewHeight.current = e.nativeEvent.layout.height
      checkScrollableAfterLayout()
    },
    [checkScrollableAfterLayout]
  )
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [footerLayout, setFooterLayout] = useState<
    LayoutRectangle | undefined
  >()

  const headerRef = useRef<View>(null)

  const {
    onScroll: onFadingScroll,
    scrollY,
    targetHiddenProgress
  } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: isModal,
    hasParent,
    hideHeaderBackground,
    renderHeaderRight,
    showNavigationHeaderTitle
  })

  const onScroll = useCallback(
    (
      event:
        | NativeSyntheticEvent<NativeScrollEvent>
        | NativeScrollEvent
        | number
    ) => {
      onFadingScroll(event)

      if (onScrolledToEnd) {
        let offsetY = 0
        if (typeof event === 'number') {
          offsetY = event
        } else if ('nativeEvent' in event) {
          offsetY = event.nativeEvent.contentOffset.y
        } else {
          offsetY = event.contentOffset.y
        }
        checkScrolledToEnd(offsetY)
      }
    },
    [onFadingScroll, onScrolledToEnd, checkScrolledToEnd]
  )

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [0.95, 1, 0.95]
    )
    return {
      opacity: 1 - targetHiddenProgress.value * 2,
      transform: [{ scale }],
      transformOrigin: 'bottom left'
    }
  })

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setHeaderLayout({ x, y, width, height })
  }, [])

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setFooterLayout({ x, y, width, height })
  }, [])

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity
    }
  })

  const renderHeaderContent = useCallback(() => {
    if (title || subtitle || renderHeader) {
      const hasTitle = Boolean(title || subtitle)
      return (
        <View collapsable={false}>
          <View
            ref={headerRef}
            collapsable={false}
            onLayout={handleHeaderLayout}
            style={[headerStyle, hasTitle ? { gap: 8 } : undefined]}>
            {title ? (
              <Animated.View style={[animatedHeaderStyle]}>
                <ScreenHeader
                  title={title ?? ''}
                  titleSx={titleSx}
                  titleNumberOfLines={4}
                />
              </Animated.View>
            ) : null}

            {subtitle ? <Text variant="body1">{subtitle}</Text> : null}
            {!hasTitle && renderHeader?.()}
          </View>

          {hasTitle && renderHeader?.()}
        </View>
      )
    } else {
      // If we don't have a title or subtitle, we need to render an empty header
      // so that the header height is not undefined
      return (
        <View
          ref={headerRef}
          collapsable={false}
          onLayout={handleHeaderLayout}
          style={[
            headerStyle,
            {
              position: 'absolute',
              minHeight: headerHeight,
              pointerEvents: 'none'
            }
          ]}
        />
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    headerRef,
    headerHeight,
    headerStyle,
    handleHeaderLayout,
    renderHeader,
    subtitle,
    title,
    titleSx
  ])

  const renderFooterContent = useCallback(() => {
    if (renderFooter) {
      const footer = renderFooter()
      if (footer) {
        const footerInner = (
          <View
            collapsable={false}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}>
            <LinearGradientBottomWrapper>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: insets.bottom + 16
                }}>
                <View onLayout={handleFooterLayout}>{footer}</View>
              </View>
            </LinearGradientBottomWrapper>
          </View>
        )

        if (shouldAvoidKeyboard) {
          const measuredFooterHeight = footerLayout?.height ?? 0
          const footerMinHeight =
            measuredFooterHeight > 0
              ? measuredFooterHeight + insets.bottom + 16
              : 88
          return (
            <KeyboardStickyView
              enabled={!disableStickyFooter}
              offset={{
                opened: insets.bottom
              }}
              style={{ minHeight: footerMinHeight }}>
              {footerInner}
            </KeyboardStickyView>
          )
        }

        return footerInner
      }
    }

    return null
  }, [
    renderFooter,
    footerLayout?.height,
    insets.bottom,
    handleFooterLayout,
    shouldAvoidKeyboard,
    disableStickyFooter
  ])

  const renderGrabber = useCallback(() => {
    if (isModal)
      return (
        <View
          style={{
            position: 'absolute',
            top: Platform.OS === 'android' ? insets.top - 2 : 9,
            left: 0,
            right: 0,
            zIndex: 1000
          }}>
          <Grabber />
        </View>
      )
  }, [insets.top, isModal])

  const renderHeaderBackground = useCallback(() => {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: headerHeight
        }}>
        <BlurViewWithFallback
          style={{
            flex: 1
          }}
        />
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
      </View>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerHeight, hideHeaderBackground])

  // 90% of our screens reuse this component but only some need keyboard avoiding
  // If you have an input on the screen, you need to enable this prop
  if (shouldAvoidKeyboard) {
    return (
      <View style={{ flex: 1 }} collapsable={false}>
        <KeyboardScrollView
          testID={testID}
          extraKeyboardSpace={disableStickyFooter ? -insets.bottom : 0}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...props}
          style={{
            flex: 1
          }}
          contentContainerStyle={[
            props?.contentContainerStyle,
            {
              paddingBottom: disableStickyFooter
                ? insets.bottom + 32
                : (footerLayout?.height ?? 0) + 32,
              paddingTop: headerHeight
            }
          ]}
          onScroll={onScroll}
          onContentSizeChange={
            onScrolledToEnd ? handleContentSizeChange : undefined
          }
          onLayout={onScrolledToEnd ? handleScrollViewLayout : undefined}>
          {renderHeaderContent()}
          {children}
        </KeyboardScrollView>

        {renderFooterContent()}
        {renderHeaderBackground()}
        {headerCenterOverlay}
        {renderGrabber()}
      </View>
    )
  }

  // All of our screens have to be scrollable
  // If we don't have an input on the screen then we should not enable keyboard avoiding
  return (
    <View style={[{ flex: 1 }, props.style]} collapsable={false}>
      <ScrollView
        testID={testID}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        {...props}
        contentContainerStyle={[
          props?.contentContainerStyle,
          {
            paddingBottom: (footerLayout?.height ?? 0) + insets.bottom + 32,
            paddingTop: headerHeight
          }
        ]}
        onScroll={onScroll}
        onContentSizeChange={
          onScrolledToEnd ? handleContentSizeChange : undefined
        }
        onLayout={onScrolledToEnd ? handleScrollViewLayout : undefined}>
        {renderHeaderContent()}
        {children}
      </ScrollView>

      {renderFooterContent()}
      {renderHeaderBackground()}
      {headerCenterOverlay}
      {renderGrabber()}
    </View>
  )
}
