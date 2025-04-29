import {
  NavigationTitleHeader,
  Text,
  useKeyboardHeight
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { LayoutRectangle, View } from 'react-native'
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

interface FlatListScreenTemplateProps extends KeyboardAwareScrollViewProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  hasParent?: boolean
  isModal?: boolean
  disabled?: boolean
  navigationTitle?: string
  renderHeader?: () => JSX.Element
  renderFooter?: () => JSX.Element
  renderHeaderRight?: () => JSX.Element
}

export const ScrollViewScreenTemplate = ({
  title,
  subtitle,
  children,
  hasParent,
  isModal,
  disabled,
  navigationTitle,
  renderHeader,
  renderFooter,
  renderHeaderRight,
  ...props
}: FlatListScreenTemplateProps): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const keyboardHeight = useKeyboardHeight()

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
      headerRef.current.measure((x, y, width, height) => {
        contentHeaderHeight.value = height
        setHeaderLayout({ x, y, width, height })
      })
    }
  }, [contentHeaderHeight])

  return (
    <KeyboardAvoidingView
      enabled={!disabled}
      keyboardVerticalOffset={isModal ? insets.bottom - 16 : -insets.bottom}>
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
