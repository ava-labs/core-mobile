import { ANIMATED, NavigationTitleHeader } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
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
import ScreenHeader from './ScreenHeader'

interface ListScreenProps<T>
  extends Omit<FlatListPropsWithLayout<T>, 'ListHeaderComponent'> {
  title: string
  navigationTitle?: string
  data: T[]
  hasParent?: boolean
  isModal?: boolean
  renderHeader?: () => React.ReactNode
  renderHeaderRight?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const ListScreen = <T,>({
  data,
  title,
  navigationTitle,
  hasParent = false,
  isModal = false,
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
      <Animated.View style={[animatedHeaderContainerStyle]}>
        <BlurViewWithFallback
          style={{
            paddingBottom: 12,
            paddingHorizontal: 16,
            paddingTop: 12
          }}>
          <Animated.View
            style={[
              animatedHeaderStyle,
              {
                paddingTop: headerHeight
              }
            ]}>
            <View ref={headerRef}>
              <ScreenHeader title={title} />
            </View>
          </Animated.View>

          {renderHeader?.()}
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
        paddingBottom: insets.bottom
      }
    ] as StyleProp<ViewStyle>[]
  }, [props?.contentContainerStyle, data.length, insets.bottom])

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={insets.bottom}
      style={{
        flex: 1
      }}>
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
