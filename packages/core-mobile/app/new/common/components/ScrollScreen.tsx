import {
  NavigationTitleHeader,
  Text,
  useKeyboardHeight
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useIsAndroidWithBottomBar } from 'common/hooks/useIsAndroidWithBottomBar'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { LayoutRectangle, Platform, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import { KeyboardAvoidingView } from './KeyboardAvoidingView'
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
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** The main content to be displayed in the scrollable area */
  children: React.ReactNode
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Whether this screen is presented as a secondary modal (ActionSheet) */
  isSecondaryModal?: boolean
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
  /** The distance between keyboard and focused TextInput when keyboard is shown. Default is 0. */
  bottomOffset?: number
}

export const ScrollScreen = ({
  title,
  subtitle,
  children,
  hasParent,
  isModal,
  isSecondaryModal,
  shouldAvoidKeyboard,
  navigationTitle,
  renderHeader,
  renderFooter,
  renderHeaderRight,
  bottomOffset,
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
  const { topMarginOffset } = useModalScreenOptions()

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal || isSecondaryModal ? true : false,
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
    if (isSecondaryModal) {
      if (Platform.OS === 'android') {
        return -insets.bottom - 8
      }
      return insets.bottom
    }
    if (isModal) {
      if (isAndroidWithBottomBar) {
        return 16
      }
      return insets.bottom + 16
    }

    return insets.bottom
  }, [isSecondaryModal, isModal, insets.bottom, isAndroidWithBottomBar])

  const paddingBottom = useMemo(() => {
    if (isSecondaryModal) {
      return Platform.select({
        ios: topMarginOffset + 16,
        android: isAndroidWithBottomBar
          ? topMarginOffset + insets.bottom + 16
          : topMarginOffset + insets.bottom + insets.top + 48
      })
    }

    if (isModal) {
      return Platform.select({
        ios: insets.bottom + 8,
        android: insets.bottom + 16
      })
    }

    return insets.bottom
  }, [
    isSecondaryModal,
    isModal,
    insets.bottom,
    insets.top,
    topMarginOffset,
    isAndroidWithBottomBar
  ])

  const renderContent = useCallback(() => {
    return (
      <>
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
      </>
    )
  }, [animatedHeaderStyle, children, renderHeader, subtitle, title])

  // 90% of our screens reuse this component but only some need keyboard avoiding
  // If you have an input on the screen, you need to enable this prop
  if (shouldAvoidKeyboard) {
    return (
      <KeyboardAvoidingView keyboardVerticalOffset={keyboardVerticalOffset}>
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
          bottomOffset={bottomOffset}
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
          {renderContent()}
        </KeyboardAwareScrollView>

        {renderFooter ? (
          <LinearGradientBottomWrapper>
            <View
              style={{
                padding: 16,
                paddingTop: 0,
                paddingBottom
              }}>
              {renderFooter?.()}
            </View>
          </LinearGradientBottomWrapper>
        ) : null}
      </KeyboardAvoidingView>
    )
  }

  // All of our screens have to be scrollable
  // If we don't have an input on the screen then we should not enable keyboard avoiding
  return (
    <KeyboardAvoidingView enabled={false} style={{ flex: 1 }}>
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
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        {...props}
        contentContainerStyle={[
          props?.contentContainerStyle,
          {
            paddingBottom: insets.bottom,
            paddingTop: headerHeight
          }
        ]}
        onScroll={onScroll}>
        {renderContent()}
      </ScrollView>

      {renderFooter ? (
        <LinearGradientBottomWrapper>
          <View
            style={{
              padding: 16,
              paddingTop: 0,
              paddingBottom
            }}>
            {renderFooter?.()}
          </View>
        </LinearGradientBottomWrapper>
      ) : null}
    </KeyboardAvoidingView>
  )
}
