import {
  ANIMATED,
  Icons,
  SCREEN_HEIGHT,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import { HORIZONTAL_MARGIN } from 'features/portfolio/collectibles/consts'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CollectibleFilterAndSortInitialState,
  useCollectiblesFilterAndSort
} from '../hooks/useCollectiblesFilterAndSort'
import { CollectibleDetailsContent } from './CollectibleDetailsContent'
import {
  CARD_SIZE_SMALL,
  CollectibleDetailsHero,
  SNAP_DISTANCE
} from './CollectibleDetailsHero'

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
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  const { filteredAndSorted } = useCollectiblesFilterAndSort(initial)

  const [currentIndex, setCurrentIndex] = useState(
    filteredAndSorted?.findIndex(
      item => item.localId.toLowerCase() === localId?.toLowerCase()
    ) ?? -1
  )

  const collectible = useMemo(
    () => filteredAndSorted[currentIndex],
    [currentIndex, filteredAndSorted]
  )

  const isFirst = currentIndex === 0
  const isLast = currentIndex === filteredAndSorted.length - 1

  const scrollY = useSharedValue(0)
  const bounceValue = useSharedValue(0)
  const scrollViewRef = useRef<Animated.ScrollView>(null)

  const scrollViewHandler = useAnimatedScrollHandler(event => {
    'worklet'
    scrollY.value = event.contentOffset.y
  })

  const onSeeMore = (): void => {
    'worklet'
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

  const headerRight = useCallback((): ReactNode => {
    if (!collectible) return null

    return (
      <View style={{ flexDirection: 'row', paddingRight: HORIZONTAL_MARGIN }}>
        <Pressable
          disabled={isFirst}
          style={{
            height: '100%'
          }}
          onPress={onPrevious}>
          <View
            style={{
              padding: 8,
              height: '100%',
              opacity: isFirst ? 0.4 : 1,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ rotate: '180deg' }]
            }}>
            <Icons.Custom.ArrowDown
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
        </Pressable>
        <Pressable
          style={{
            height: '100%'
          }}
          hitSlop={{
            top: 0,
            right: HORIZONTAL_MARGIN,
            bottom: 0,
            left: 0
          }}
          disabled={isLast}
          onPress={onNext}>
          <View
            style={{
              height: '100%',
              padding: 8,
              opacity: isLast ? 0.4 : 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Icons.Custom.ArrowDown
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
        </Pressable>
      </View>
    )
  }, [collectible, colors.$textPrimary, isFirst, isLast, onNext, onPrevious])

  useEffect(() => {
    navigation.setOptions({
      headerRight,
      headerTransparent: true,
      headerStyle: {
        elevation: 0,
        shadowOpacity: 0
      }
    })
  }, [navigation, currentIndex, filteredAndSorted, headerRight])

  const onBack = useCallback((): void => {
    navigation.goBack()
  }, [navigation])

  const renderEmpty = useMemo((): ReactNode => {
    return (
      <ErrorState
        sx={{ height: SCREEN_HEIGHT - headerHeight, paddingTop: headerHeight }}
        title={`Oops\nThis collectible could not be loaded`}
        description="Please hit refresh or try again later"
        button={{
          title: 'Go back',
          onPress: onBack
        }}
      />
    )
  }, [headerHeight, onBack])

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
      [SCREEN_HEIGHT, CARD_SIZE_SMALL],
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
    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, -SCREEN_HEIGHT + headerHeight + SNAP_DISTANCE * 2],
      Extrapolation.CLAMP
    )

    return {
      top: SCREEN_HEIGHT,
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT - headerHeight - SNAP_DISTANCE,
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

  return (
    <View
      style={{
        flex: 1
      }}>
      {collectible ? (
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollViewHandler}
          style={{
            flex: 1,
            position: 'relative'
          }}
          contentContainerStyle={{
            paddingBottom: insets.bottom,
            minHeight: SCREEN_HEIGHT + SNAP_DISTANCE
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          overScrollMode="never"
          stickyHeaderIndices={[0]}
          nestedScrollEnabled>
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
                    color={colors.$textSecondary}
                    width={40}
                    height={10}
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
              collectibles={filteredAndSorted}
              collectible={collectible}
            />
          </Animated.View>
        </Animated.ScrollView>
      ) : (
        renderEmpty
      )}
    </View>
  )
}
