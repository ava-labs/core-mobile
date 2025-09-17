import {
  NavigationTitleHeader,
  Separator,
  SxProp,
  Text
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { LayoutRectangle, StyleProp, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardStickyView
} from 'react-native-keyboard-controller'
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
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
  hideHeaderBackground,
  headerStyle,
  renderHeader,
  renderFooter,
  renderHeaderRight,
  ...props
}: ScrollScreenProps): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)
  const footerRef = useRef<View>(null)
  const footerHeight = useSharedValue<number>(0)

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal,
      hasParent,
      hideHeaderBackground,
      renderHeaderRight,
      showNavigationHeaderTitle
    }
  )

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [0.95, 1, 0.95]
    )
    return {
      opacity: 1 - targetHiddenProgress.value * 2,
      transform: [{ scale }]
    }
  })

  useLayoutEffect(() => {
    // eslint-disable-next-line max-params
    headerRef?.current?.measure((x, y, width, height) => {
      contentHeaderHeight.value = height
      setHeaderLayout({ x, y, width, height })
    })
  }, [contentHeaderHeight])

  useLayoutEffect(() => {
    // eslint-disable-next-line max-params
    footerRef?.current?.measure((x, y, width, height) => {
      footerHeight.value = height
    })
  }, [footerHeight])

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity
    }
  })

  const renderHeaderContent = useCallback(() => {
    if (title || subtitle || renderHeader) {
      return (
        <View>
          <View
            ref={headerRef}
            style={[
              headerStyle,
              {
                gap: 8
              }
            ]}>
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
          </View>

          {renderHeader?.()}
        </View>
      )
    }
  }, [animatedHeaderStyle, headerStyle, renderHeader, subtitle, title, titleSx])

  const animatedContentContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: disableStickyFooter
        ? insets.bottom + 24
        : footerHeight.value
    }
  })

  // 90% of our screens reuse this component but only some need keyboard avoiding
  // If you have an input on the screen, you need to enable this prop
  if (shouldAvoidKeyboard) {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardScrollView
          extraKeyboardSpace={
            disableStickyFooter ? -footerHeight.value - insets.bottom : 0
          }
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...props}
          style={{
            flex: 1
          }}
          contentContainerStyle={[
            props?.contentContainerStyle,
            animatedContentContainerStyle,
            {
              paddingTop: headerHeight
            }
          ]}
          onScroll={onScroll}>
          {renderHeaderContent()}
          {children}
        </KeyboardScrollView>

        {renderFooter && renderFooter() ? (
          <KeyboardStickyView
            enabled={!disableStickyFooter}
            offset={{
              opened: insets.bottom
            }}>
            <LinearGradientBottomWrapper>
              <Animated.View
                entering={FadeIn.delay(500)}
                ref={footerRef}
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: insets.bottom + 16
                }}>
                {renderFooter()}
              </Animated.View>
            </LinearGradientBottomWrapper>
          </KeyboardStickyView>
        ) : null}

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
      </View>
    )
  }

  // All of our screens have to be scrollable
  // If we don't have an input on the screen then we should not enable keyboard avoiding
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        {...props}
        contentContainerStyle={[
          props?.contentContainerStyle,
          {
            paddingBottom: insets.bottom + 32,
            paddingTop: headerHeight
          }
        ]}
        onScroll={onScroll}>
        {renderHeaderContent()}
        {children}
      </ScrollView>

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

      {renderFooter && renderFooter() ? (
        <LinearGradientBottomWrapper>
          <Animated.View
            entering={FadeIn.delay(500)}
            style={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16
            }}>
            {renderFooter()}
          </Animated.View>
        </LinearGradientBottomWrapper>
      ) : null}
    </View>
  )
}
