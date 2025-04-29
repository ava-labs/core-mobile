import {
  NavigationTitleHeader,
  Text,
  useKeyboardHeight
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LayoutRectangle, Platform, View } from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import { KeyboardAvoidingView } from './KeyboardAvoidingView'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'
import ScreenHeader from './ScreenHeader'

// Use this component when you need a scrollable screen with proper keyboard handling and header management.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// It provides:
// - A navigation bar with a title
// - A header with a title and subtitle
// - A footer with a loading indicator
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

// Used by screens that need scrollable content with keyboard and header management

interface ScrollScreenProps extends KeyboardAwareScrollViewProps {
  /** The main title displayed at the top of the screen */
  title?: string
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
  /** Title to be displayed in the navigation header */
  navigationTitle?: string
  /** Custom header component to be rendered */
  renderHeader?: () => React.ReactNode
  /** Custom footer component to be rendered at the bottom of the screen */
  renderFooter?: () => React.ReactNode
  /** Custom component to be rendered on the right side of the header */
  renderHeaderRight?: () => React.ReactNode
}

function useIsAndroidWithBottomBar(): boolean {
  const insets = useSafeAreaInsets()
  if (Platform.OS !== 'android') {
    return false
  }
  return insets.bottom > 24
}

export const ScrollScreen = ({
  title,
  subtitle,
  children,
  hasParent,
  isModal,
  shouldAvoidKeyboard = true,
  navigationTitle,
  renderHeader,
  renderFooter,
  renderHeaderRight,
  ...props
}: ScrollScreenProps): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const keyboardHeight = useKeyboardHeight()
  const isAndroidWithBottomBar = useIsAndroidWithBottomBar()
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal ? true : false,
      hasParent,
      renderHeaderRight
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
    if (headerRef.current) {
      // eslint-disable-next-line max-params
      headerRef.current.measure((x, y, width, height) => {
        contentHeaderHeight.value = height
        setHeaderLayout({ x, y, width, height })
      })
    }
  }, [contentHeaderHeight])

  const keyboardVerticalOffset = useMemo(() => {
    if (isModal) {
      if (Platform.OS === 'ios') {
        return 0
      }
      if (isAndroidWithBottomBar) {
        return -8
      }
      return 16
    }
    return -insets.bottom
  }, [isModal, insets.bottom, isAndroidWithBottomBar])

  return (
    <KeyboardAvoidingView
      enabled={shouldAvoidKeyboard}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      <BlurViewWithFallback
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: headerHeight,
          zIndex: 100
        }}
      />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraKeyboardSpace={-keyboardHeight}
        {...props}
        contentContainerStyle={[
          props?.contentContainerStyle,
          {
            paddingBottom: insets.bottom,
            paddingTop: headerHeight
          }
        ]}
        onScroll={onScroll}>
        <View
          style={{
            paddingBottom: 12
          }}>
          <View
            ref={headerRef}
            style={{
              gap: 8,
              paddingTop: 12
            }}>
            {title ? (
              <Animated.View style={[animatedHeaderStyle]}>
                <ScreenHeader title={title ?? ''} />
              </Animated.View>
            ) : null}

            {subtitle ? <Text variant="body1">{subtitle}</Text> : null}
          </View>

          {renderHeader?.()}
        </View>

        {children}
      </KeyboardAwareScrollView>

      {renderFooter ? (
        <LinearGradientBottomWrapper>
          <View
            style={{
              padding: 16,
              paddingTop: 0,
              paddingBottom: insets.bottom + 16
            }}>
            {renderFooter?.()}
          </View>
        </LinearGradientBottomWrapper>
      ) : null}
    </KeyboardAvoidingView>
  )
}
