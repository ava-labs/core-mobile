import { ANIMATED, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { showSnackbar } from 'common/utils/toast'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Pressable } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleVisibility,
  toggleCollectibleVisibility
} from 'store/portfolio'
import { CollectibleDetailsContent } from '../components/CollectibleDetailsContent'
import {
  CARD_SIZE_SMALL,
  CollectibleDetailsHero,
  SNAP_DISTANCE
} from '../components/CollectibleDetailsHero'
import {
  CollectibleFilterAndSortInitialState,
  useCollectiblesFilterAndSort
} from '../hooks/useCollectiblesFilterAndSort'

type CollectibleDetailsScreenRouteParams = {
  localId?: string
  initial?: CollectibleFilterAndSortInitialState
}

export const CollectibleDetailsScreen = ({
  localId,
  initial
}: CollectibleDetailsScreenRouteParams): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const frame = useSafeAreaFrame()

  const { filteredAndSorted, isHiddenVisible } =
    useCollectiblesFilterAndSort(initial)

  const [currentIndex, setCurrentIndex] = useState(
    filteredAndSorted?.findIndex(
      item => item.localId.toLowerCase() === localId?.toLowerCase()
    ) ?? -1
  )

  const collectible = useMemo(
    () => filteredAndSorted[currentIndex],
    [currentIndex, filteredAndSorted]
  )

  const collectibleVisibility = useSelector(selectCollectibleVisibility)
  const isVisible = collectible
    ? isCollectibleVisible(collectibleVisibility, collectible)
    : false

  const isFirst = currentIndex === 0
  const isLast = currentIndex === filteredAndSorted.length - 1

  const scrollY = useSharedValue(0)
  const bounceValue = useSharedValue(0)
  const scrollViewRef = useRef<Animated.ScrollView>(null)

  const onScroll = useAnimatedScrollHandler(event => {
    'worklet'
    scrollY.value = event.contentOffset.y
  })

  const onScrollEndDrag = useCallback((): void => {
    'worklet'
    if (scrollY.value > SNAP_DISTANCE / 2) {
      scrollViewRef.current?.scrollToEnd()
    } else {
      scrollViewRef.current?.scrollTo({
        y: 0
      })
    }
  }, [scrollY])

  const onSeeMore = (): void => {
    'worklet'
    // Also do the bounce animation
    bounceValue.value = withSequence(
      withTiming(-40, ANIMATED.TIMING_CONFIG),
      withTiming(0, ANIMATED.TIMING_CONFIG)
    )
  }

  const onPrevious = useCallback((): void => {
    if (isFirst) return
    setCurrentIndex(currentIndex - 1)
  }, [currentIndex, isFirst])

  const onNext = useCallback((): void => {
    if (isLast) return
    setCurrentIndex(currentIndex + 1)
  }, [currentIndex, isLast])

  const onHide = useCallback((): void => {
    if (collectible?.localId) {
      dispatch(toggleCollectibleVisibility({ uid: collectible.localId }))

      if (isVisible) {
        showSnackbar('Collectible hidden')
      } else {
        showSnackbar('Collectible unhidden')
      }

      if (isHiddenVisible) {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }

        if (filteredAndSorted.length === 1) {
          navigation.goBack()
        }
      }
    }
  }, [
    collectible?.localId,
    currentIndex,
    dispatch,
    filteredAndSorted.length,
    isHiddenVisible,
    isVisible,
    navigation
  ])

  const headerRight = useCallback((): ReactNode => {
    if (!collectible) return null

    return (
      <View style={{ flexDirection: 'row' }}>
        <NavigationBarButton onPress={onPrevious} disabled={isFirst}>
          <View
            style={{
              transform: [{ rotate: '180deg' }]
            }}>
            <Icons.Custom.ArrowDown
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
        </NavigationBarButton>
        <NavigationBarButton onPress={onNext} disabled={isLast}>
          <Icons.Custom.ArrowDown
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        </NavigationBarButton>
      </View>
    )
  }, [collectible, colors.$textPrimary, isFirst, isLast, onNext, onPrevious])

  useEffect(() => {
    navigation.setOptions({
      headerRight
    })
  }, [navigation, currentIndex, filteredAndSorted, headerRight])

  const onBack = useCallback((): void => {
    navigation.goBack()
  }, [navigation])

  const renderEmpty = useMemo((): ReactNode => {
    return (
      <ErrorState
        sx={{ height: frame.height - headerHeight, paddingTop: headerHeight }}
        title={`Oops\nThis collectible could not be loaded`}
        description="Please hit refresh or try again later"
        button={{
          title: 'Go back',
          onPress: onBack
        }}
      />
    )
  }, [frame.height, headerHeight, onBack])

  const heroStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, headerHeight + 70],
      Extrapolation.CLAMP
    )

    const height = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [frame.height, CARD_SIZE_SMALL],
      Extrapolation.CLAMP
    )

    return {
      height,
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    const height = frame.height - headerHeight - SNAP_DISTANCE + 10

    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, -frame.height + headerHeight + SNAP_DISTANCE * 2 - 10],
      Extrapolation.CLAMP
    )

    return {
      top: frame.height,
      left: 0,
      right: 0,
      height,
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const expandStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE / 5],
      [1, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity
    }
  })

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: bounceValue.value
        }
      ]
    }
  })

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: insets.bottom,
      minHeight: frame.height + SNAP_DISTANCE
    }
  }, [frame.height, insets.bottom])

  return (
    <View
      style={{
        flex: 1
      }}>
      {collectible ? (
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={onScroll}
          style={{
            flex: 1,
            position: 'relative'
          }}
          contentContainerStyle={contentContainerStyle}
          onScrollEndDrag={onScrollEndDrag}
          nestedScrollEnabled
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          stickyHeaderIndices={[0]}>
          <Animated.View
            style={[
              {
                flex: 1,
                zIndex: 100,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }
            ]}>
            <Animated.View
              style={[
                heroStyle,
                bounceStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center'
                }
              ]}>
              <CollectibleDetailsHero
                collectible={collectible}
                scrollY={scrollY}
              />
              <Animated.View
                style={[
                  expandStyle,
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    bottom: insets.bottom + 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }
                ]}>
                <Pressable
                  onPress={onSeeMore}
                  hitSlop={{
                    top: 34,
                    bottom: 34,
                    left: 4,
                    right: 4
                  }}
                  style={{
                    opacity: 0.3
                  }}>
                  <Icons.Custom.ArrowDownHandleBar
                    testID="collectibles_handler"
                    color={colors.$textSecondary}
                    width={40}
                  />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                zIndex: 1000
              },
              contentStyle
            ]}>
            <CollectibleDetailsContent
              isVisible={isVisible}
              collectible={collectible}
              onHide={onHide}
            />
          </Animated.View>
        </Animated.ScrollView>
      ) : (
        renderEmpty
      )}
    </View>
  )
}
