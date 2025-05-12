import {
  ANIMATED,
  NavigationTitleHeader,
  Separator,
  SPRING_LINEAR_TRANSITION,
  Text
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  FlatListProps,
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
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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

interface ListScreenProps<T>
  extends Omit<
    FlatListProps<T>,
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
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const ListScreen = <T,>({
  data,
  title,
  navigationTitle,
  hasParent,
  isModal,
  hasTabBar,
  showNavigationHeaderTitle = true,
  renderEmpty,
  renderHeader,
  renderHeaderRight,
  ...rest
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)
  const keyboard = useKeyboardState()

  const tabBarHeight = useBottomTabBarHeight()

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal,
      hideHeaderBackground: true,
      hasSeparator: false,
      hasParent,
      showNavigationHeaderTitle,
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
      headerRef.current.measure((x, y, w, h) => {
        contentHeaderHeight.value = h
        setHeaderLayout({ x, y, width: w, height: h / 2 })
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
      [0, -contentHeaderHeight.value - 8],
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

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity
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
        </BlurViewWithFallback>
      </Animated.View>
    )
  }, [
    animatedBorderStyle,
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

  const contentContainerStyle = useMemo(() => {
    let paddingBottom = insets.bottom + 16

    if (hasTabBar) {
      paddingBottom = Platform.OS === 'ios' ? insets.bottom + 32 : 16
    }

    return [
      rest?.contentContainerStyle,
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
  }, [insets.bottom, hasTabBar, rest?.contentContainerStyle, data.length])

  const animatedContainerStyle = useAnimatedStyle(() => {
    let bottomOffset = keyboard.isVisible ? keyboard.height - insets.bottom : 0

    if (hasTabBar) {
      if (keyboard.isVisible) {
        bottomOffset =
          keyboard.height -
          insets.bottom -
          tabBarHeight -
          (Platform.OS === 'ios' ? 16 : 56)
      } else {
        bottomOffset = Platform.OS === 'ios' ? insets.bottom : 0
      }
    }

    return {
      // TODO: Couldn't make Android work with keyboard avoidance, so we need to add a bottom offset
      // iOS works with automaticallyAdjustKeyboardInsets but we do keep the same thing here for consistency
      paddingBottom: withTiming(bottomOffset, {
        ...ANIMATED.TIMING_CONFIG,
        duration: 50
      })
    }
  })

  return (
    <Animated.View
      style={[animatedContainerStyle, { flex: 1 }]}
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
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
      />
    </Animated.View>
  )
}

const RenderScrollComponent = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />
)
