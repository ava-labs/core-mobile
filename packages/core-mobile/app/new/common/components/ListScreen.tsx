import { ANIMATED, NavigationTitleHeader, Text } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useIsAndroidWithBottomBar } from 'common/hooks/useIsAndroidWithBottomBar'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import Animated, {
  FlatListPropsWithLayout,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import { ErrorState } from './ErrorState'
import { KeyboardAvoidingView } from './KeyboardAvoidingView'
// Use this component when you need to display a list of items in a screen.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// It provides:
// - A navigation bar with a title
// - A header with a title
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

// Used by all screens that display a list of items

interface ListScreenProps<T>
  extends Omit<
    FlatListPropsWithLayout<T>,
    'ListHeaderComponent' | 'ListFooterComponent'
  > {
  /** The title displayed in the screen header */
  title: string
  /** Optional title to display in the navigation bar */
  navigationTitle?: string
  /** Array of data items to be rendered in the list */
  data: T[]
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Whether this screen is presented as a secondary modal (ActionSheet) */
  isSecondaryModal?: boolean
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
  navigationTitle,
  hasParent = false,
  isModal = false,
  isSecondaryModal = false,
  renderEmpty,
  renderHeader,
  renderHeaderRight,
  ...props
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)
  const { topMarginOffset } = useModalScreenOptions()
  const isAndroidWithBottomBar = useIsAndroidWithBottomBar()

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
      [-contentHeaderHeight.value, 0, contentHeaderHeight.value],
      [0.95, 1, 0.95]
    )
    return {
      opacity: 1 - targetHiddenProgress.value * 2,
      transform: [{ scale: data.length === 0 ? 1 : scale }]
    }
  })

  useLayoutEffect(() => {
    if (headerRef.current) {
      // eslint-disable-next-line max-params
      headerRef.current.measure((x, y, width, height) => {
        contentHeaderHeight.value = height
        setHeaderLayout({ x, y, width, height: height / 2 })
      })
    }
  }, [contentHeaderHeight])

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
      [0, -contentHeaderHeight.value],
      'clamp'
    )

    return {
      transform: [
        {
          translateY: withSpring(translateY, {
            ...ANIMATED.SPRING_CONFIG,
            stiffness: 100
          })
        }
      ]
    }
  })

  const ListHeaderComponent = useMemo(() => {
    return (
      <Animated.View style={[animatedHeaderContainerStyle, { gap: 12 }]}>
        <BlurViewWithFallback
          style={{
            paddingHorizontal: 16,
            paddingTop: renderHeader ? 12 : 0
          }}>
          {title ? (
            <Animated.View
              style={[
                animatedHeaderStyle,
                {
                  paddingTop: headerHeight
                }
              ]}>
              <View
                ref={headerRef}
                style={{
                  paddingBottom: 12
                }}>
                <Text variant="heading2">{title}</Text>
              </View>
            </Animated.View>
          ) : null}

          <View style={{ paddingBottom: renderHeader ? 12 : 0 }}>
            {renderHeader?.()}
          </View>
        </BlurViewWithFallback>
      </Animated.View>
    )
  }, [
    animatedHeaderContainerStyle,
    animatedHeaderStyle,
    headerHeight,
    renderHeader,
    title
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

  const keyboardVerticalOffset = useMemo(() => {
    if (isSecondaryModal) {
      if (Platform.OS === 'android') {
        return -insets.bottom + 8
      }
      return insets.bottom
    }
    if (isAndroidWithBottomBar) {
      return 16
    }
    return insets.bottom + 16
  }, [insets.bottom, isAndroidWithBottomBar, isSecondaryModal])

  const paddingBottom = useMemo(() => {
    if (isSecondaryModal) {
      return Platform.select({
        ios: topMarginOffset + 24,
        android: topMarginOffset + insets.bottom + insets.top + 32
      })
    }

    return insets.bottom
  }, [isSecondaryModal, insets.bottom, insets.top, topMarginOffset])

  const contentContainerStyle = useMemo(() => {
    return [
      props?.contentContainerStyle,
      data.length === 0
        ? {
            justifyContent: 'center',
            flex: 1
          }
        : {},
      {
        paddingBottom
      }
    ] as StyleProp<ViewStyle>[]
  }, [props?.contentContainerStyle, data.length, paddingBottom])

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={{
        flex: 1
      }}>
      {/* @ts-ignore TODO: ListScreen improvement */}
      <AnimatedFlatList
        data={data}
        onScroll={onScrollEvent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={15}
        windowSize={5}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        layout={LinearTransition.springify()}
        entering={getListItemEnteringAnimation(0)}
        style={{
          flex: 1
        }}
        {...props}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
      />
    </KeyboardAvoidingView>
  )
}
