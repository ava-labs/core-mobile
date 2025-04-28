import {
  NavigationTitleHeader,
  SafeAreaView,
  useKeyboardHeight
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
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
import ScreenHeader from './ScreenHeader'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'

interface FlatListScreenTemplateProps extends KeyboardAwareScrollViewProps {
  title: string
  children: React.ReactNode
  hasParent?: boolean
  isModal?: boolean
  disabled?: boolean
  renderHeader?: () => React.ReactNode
  renderFooter?: () => React.ReactNode
  renderHeaderRight?: () => React.ReactNode
}

export const ScrollViewScreenTemplate = ({
  title,
  children,
  hasParent,
  isModal,
  disabled,
  renderHeader,
  renderFooter,
  renderHeaderRight,
  ...props
}: FlatListScreenTemplateProps): React.ReactNode => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const headerHeight = useHeaderHeight()
  const keyboardHeight = useKeyboardHeight()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={title} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal ? true : false
    }
  )

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [1.05, 1, 0.95]
    )
    return {
      opacity: 1 - targetHiddenProgress.value * 2,
      transform: [{ scale }]
    }
  })

  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)

  useLayoutEffect(() => {
    if (headerRef.current) {
      headerRef.current.measure((x, y, width, height) => {
        contentHeaderHeight.value = height
        setHeaderLayout({ x, y, width, height })
      })
    }
  }, [contentHeaderHeight])

  useFocusEffect(
    useCallback(() => {
      if (hasParent) {
        navigation.getParent()?.setOptions({
          headerRight: renderHeaderRight,
          headerTransparent: true
        })
        return () => {
          navigation.getParent()?.setOptions({
            headerRight: renderHeaderRight ?? undefined,
            headerTransparent: false
          })
        }
      } else {
        navigation.setOptions({
          headerRight: renderHeaderRight,
          headerTransparent: true
        })
        return () => {
          navigation?.setOptions({
            headerRight: renderHeaderRight ?? undefined,
            headerTransparent: false
          })
        }
      }
    }, [hasParent, navigation, renderHeaderRight])
  )

  return (
    <KeyboardAvoidingView
      enabled={!disabled}
      keyboardVerticalOffset={isModal ? insets.bottom : -insets.bottom}>
      <SafeAreaView edges={['bottom']} sx={{ flex: 1 }}>
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
          extraKeyboardSpace={-keyboardHeight}
          {...props}
          contentContainerStyle={[
            props?.contentContainerStyle,
            {
              paddingBottom: insets.bottom
            }
          ]}
          onScroll={onScroll}>
          <View
            style={{
              paddingBottom: 12,
              paddingTop: headerHeight
            }}>
            {title ? (
              <Animated.View style={[animatedHeaderStyle]} ref={headerRef}>
                <ScreenHeader title={title} />
              </Animated.View>
            ) : null}

            {renderHeader?.()}
          </View>
          {children}
        </KeyboardAwareScrollView>

        {renderFooter ? (
          <LinearGradientBottomWrapper>
            <View
              style={{
                padding: 16,
                paddingTop: 0
              }}>
              {renderFooter?.()}
            </View>
          </LinearGradientBottomWrapper>
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}
