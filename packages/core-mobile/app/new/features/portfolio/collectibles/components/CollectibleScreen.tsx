import { ANIMATED, IndexPath, Text, View } from '@avalabs/k2-alpine'
import { ViewToken } from '@shopify/flash-list'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { Glow, GlowRef } from 'common/components/Glow'
import { DropdownSelection } from 'common/types'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { CollectibleGridItem } from 'features/portfolio/collectibles/components/CollectibleItem'
import {
  getCollectibleName,
  HORIZONTAL_MARGIN
} from 'features/portfolio/collectibles/consts'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo
} from 'react'
import { Dimensions, Platform } from 'react-native'
import {
  Gesture,
  GestureDetector,
  Pressable,
  State
} from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { useCollectiblesFilterAndSort } from '../hooks/useCollectiblesFilterAndSort'
import { CollectibleDetailsContent } from './CollectibleDetailsContent'

export const VISIBLE_ITEM_WIDTH = 0.8
export const CAROUSEL_ITEM_GAP = 0
const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height
const CARD_SIZE = SCREEN_WIDTH * VISIBLE_ITEM_WIDTH + CAROUSEL_ITEM_GAP

const SNAP_DISTANCE = 200
const CARD_MIN_HEIGHT = 120

export const CollectibleScreen = ({
  localId,
  //   TODO: Decide on what to do with these props
  filter,
  sort
}: {
  localId?: string
  filter: DropdownSelection & { selected: IndexPath[] }
  sort: DropdownSelection
}): ReactNode => {
  const insets = useSafeAreaInsets()

  const { collectibles } = useCollectiblesContext()
  const { filteredAndSorted } = useCollectiblesFilterAndSort(collectibles)

  const scrollX = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const scrollViewContentHeight = useSharedValue(0)

  const CAROUSEL_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom

  // const { sendNftBlockediOS, sendNftBlockedAndroid } = usePosthogContext()

  const flatListRef = useRef<Animated.FlatList<NftItem>>(null)
  const glowRef = useRef<GlowRef>(null)

  const [viewableIndex, setViewableIndex] = useState(
    filteredAndSorted?.findIndex(
      item => item.localId.toLowerCase() === localId?.toLowerCase()
    ) ?? 0
  )
  const isAnyCardExpanded = useSharedValue(false)

  const currentItem = useMemo(
    () => filteredAndSorted?.[viewableIndex ?? 0],
    [filteredAndSorted, viewableIndex]
  )

  //   const canRefreshMetadata = useMemo(() => {
  //     const currentTimestamp = Math.floor(Date.now() / 1000)
  //     const refreshBackoff = 3600

  //     const updatedAt = collectible?.metadata?.lastUpdatedTimestamp

  //     return !updatedAt || currentTimestamp > updatedAt + refreshBackoff
  //   }, [collectible])

  //   const isRefreshing = useMemo(() => {
  //     if (!collectible) return false

  //     return isCollectibleRefreshing(collectible.localId)
  //   }, [isCollectibleRefreshing, collectible])

  //   const handleRefresh = useCallback(async (): Promise<void> => {
  //     if (!collectible) {
  //       return
  //     }

  //     await refreshMetadata(collectible, collectible.chainId)
  //   }, [collectible, refreshMetadata])

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const firstVisibleItem = viewableItems[0]
        if (firstVisibleItem && firstVisibleItem.index !== null) {
          setViewableIndex(firstVisibleItem.index)
        }
      }
    },
    []
  )

  const handleScrollToIndexFailed = useCallback(() => {
    if (viewableIndex !== null && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: viewableIndex,
        animated: true
      })
    }
  }, [viewableIndex])

  useEffect(() => {
    if (viewableIndex !== null && flatListRef.current) {
      flatListRef.current?.scrollToIndex({
        index: viewableIndex,
        animated: false,
        viewPosition: 0
      })
    } else {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: false
      })
    }
  }, [viewableIndex])

  const scrollHandler = useAnimatedScrollHandler(event => {
    'worklet'
    scrollX.value = event.contentOffset.x
  })

  const scrollViewHandler = useAnimatedScrollHandler(event => {
    'worklet'
    scrollViewContentHeight.value = event.contentSize.height
    scrollY.value = event.contentOffset.y
  })

  const renderItem = ({
    item,
    index
  }: {
    item: NftItem
    index: number
  }): ReactNode => (
    <CollectibleDetailsCard
      collectible={item}
      isVisible={index === viewableIndex}
      itemWidth={CARD_SIZE}
      index={index}
      scrollX={scrollX}
      scrollY={scrollY}
      onGestureEnd={onGestureEnd}
    />
  )

  const onGestureEnd = (): void => {
    glowRef.current?.startAnimation()
  }

  const flatlistContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [1, 0.5],
      Extrapolation.CLAMP
    )

    return {
      transform: [{ scale }]
    }
  })

  const topContentStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [1, 0.4],
      Extrapolation.CLAMP
    )

    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, (-CAROUSEL_HEIGHT - CARD_SIZE * 2) / 2],
      Extrapolation.CLAMP
    )

    const height = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [CAROUSEL_HEIGHT, CARD_MIN_HEIGHT],
      Extrapolation.CLAMP
    )

    return {
      //   height,
      height: CAROUSEL_HEIGHT,
      paddingBottom: insets.bottom,
      transform: [
        { scale },
        {
          translateY
        }
      ]
    }
  })

  const cardTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [1, 0],
      Extrapolation.CLAMP
    )

    return {
      opacity
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    const progress = (scrollX.value % CARD_SIZE) / CARD_SIZE
    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, -(CAROUSEL_HEIGHT - CARD_SIZE) / 2],
      Extrapolation.CLAMP
    )

    const opacity = interpolate(
      progress,
      [0, 0.5, 1],
      [1, 0, 1],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [
        {
          translateY
        }
      ]
    }
  })

  return (
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1
        }}>
        <Animated.ScrollView
          onScroll={scrollViewHandler}
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 100
          }}
          contentContainerStyle={{
            paddingBottom: insets.bottom
          }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          overScrollMode="never"
          stickyHeaderIndices={[0]}
          nestedScrollEnabled>
          <Animated.View
            style={[
              {
                flex: 1,
                position: 'absolute',
                zIndex: 100
              },
              flatlistContainerStyle
            ]}>
            <Animated.View
              style={[
                topContentStyle,
                cardTitleStyle,
                {
                  position: 'absolute',
                  alignItems: 'center',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 0,
                  pointerEvents: 'none'
                }
              ]}>
              <View
                style={{
                  gap: 22,
                  width: CARD_SIZE,
                  paddingTop: (CAROUSEL_HEIGHT - CARD_SIZE) / 2
                }}>
                <View style={{ height: CARD_SIZE }} />
                <View
                  style={{
                    zIndex: 1000,
                    gap: HORIZONTAL_MARGIN
                  }}>
                  <Text
                    variant="buttonMedium"
                    style={{
                      fontSize: 12
                    }}>
                    {`${
                      currentItem ? getCollectibleName(currentItem) : 'Untitled'
                    } #${currentItem?.tokenId} `}

                    <Text
                      sx={{
                        fontSize: 12,
                        color: '$textSecondary'
                      }}>
                      {currentItem?.description}
                    </Text>
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                topContentStyle,
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
              <Glow
                ref={glowRef}
                autoPlay
                size={(SCREEN_WIDTH - HORIZONTAL_MARGIN * 4) * 1.8}
              />
            </Animated.View>

            <Animated.FlatList
              ref={flatListRef}
              data={filteredAndSorted}
              keyExtractor={item =>
                `carousel-${item?.tokenId}-${item?.address}`
              }
              onScroll={scrollHandler}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={{
                itemVisiblePercentThreshold: 100
              }}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              animatedProps={useAnimatedProps(() => ({
                scrollEnabled: !isAnyCardExpanded.value
              }))}
              renderItem={renderItem}
              getItemLayout={(_, index) => ({
                length: CARD_SIZE,
                offset: CARD_SIZE * index,
                index
              })}
              style={[topContentStyle]}
              contentContainerStyle={{
                paddingHorizontal:
                  (SCREEN_WIDTH - SCREEN_WIDTH * VISIBLE_ITEM_WIDTH) / 2,
                gap: CAROUSEL_ITEM_GAP,
                overflow: 'visible'
              }}
              disableIntervalMomentum={true}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_SIZE}
              decelerationRate="fast"
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={11}
              scrollEventThrottle={16}
              removeClippedSubviews={Platform.OS === 'android'}
              horizontal
              pagingEnabled
              nestedScrollEnabled
            />
          </Animated.View>

          <Animated.View
            style={[
              {
                position: 'relative',
                zIndex: 1000
              },
              contentStyle
            ]}>
            <CollectibleDetailsContent collectible={currentItem} />
          </Animated.View>
        </Animated.ScrollView>
      </View>
    </BlurredBarsContentLayout>
  )
}

export const CollectibleDetailsCard = ({
  collectible,
  isVisible,
  index,
  scrollX,
  itemWidth,
  onGestureEnd
}: {
  collectible: NftItem
  isVisible: boolean
  index: number
  scrollX: SharedValue<number>
  scrollY: SharedValue<number>
  itemWidth: number
  onGestureEnd?: () => void
}): ReactNode => {
  const insets = useSafeAreaInsets()
  const [isExpanded, setIsExpanded] = useState(false)
  const CAROUSEL_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom

  const colorProgress = useSharedValue(0)

  useEffect(() => {
    colorProgress.value = withTiming(
      isVisible ? 1 : 0.6,
      ANIMATED.TIMING_CONFIG
    )
  }, [isVisible, isExpanded, colorProgress])

  useEffect(() => {
    if (!isVisible && isExpanded) {
      setIsExpanded(false)
    }
  }, [isExpanded, isVisible])

  const containerStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * itemWidth,
      index * itemWidth,
      (index + 1) * itemWidth
    ]

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.75, 1, 0.75],
      Extrapolation.CLAMP
    )

    // const height = interpolate(
    //   scrollY.value,
    //   [0, SNAP_DISTANCE],
    //   [CAROUSEL_HEIGHT, CARD_SIZE],
    //   Extrapolation.CLAMP
    // )

    return {
      zIndex: 1,
      height: '100%',
      width: itemWidth,
      transform: [{ scale: withSpring(scale, ANIMATED.SPRING_CONFIG) }]
    }
  })

  const cardStyle = useAnimatedStyle(() => {
    // const size = interpolate(
    //   scrollY.value,
    //   [0, SNAP_DISTANCE],
    //   [CARD_SIZE, CARD_MIN_HEIGHT],
    //   Extrapolation.CLAMP
    // )

    return {
      height: CARD_SIZE,
      width: CARD_SIZE
    }
  })

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          position: 'relative'
        }
      ]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            alignItems: 'center',
            justifyContent: 'center'
          }
        ]}>
        <Pinchable onGestureEnd={onGestureEnd}>
          <Animated.View style={[cardStyle]}>
            <CollectibleGridItem
              collectible={collectible}
              index={0}
              type={CollectibleView.LargeGrid}
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </Animated.View>
        </Pinchable>
      </Animated.View>
    </Animated.View>
  )
}

export const Pinchable = memo(
  ({
    children,
    onGestureEnd
  }: {
    children: ReactNode
    onGestureEnd?: () => void
  }): ReactNode => {
    const scale = useSharedValue(1)
    const rotation = useSharedValue(0)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const [isPinching, setIsPinching] = useState(false)

    // TODO: fix double onEnd triggers

    const onUpdate = (): void => {
      if (!isPinching) setIsPinching(true)
    }

    const onEnd = (): void => {
      if (isPinching) setIsPinching(false)
      onGestureEnd?.()
    }

    const pinchGesture = Gesture.Pinch()
      .onUpdate(event => {
        scale.value = event.scale
        runOnJS(onUpdate)()
      })
      .onEnd(() => {
        scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
          runOnJS(onEnd)()
        })
      })

    const rotationGesture = Gesture.Rotation()
      .onUpdate(event => {
        rotation.value = event.rotation
        runOnJS(onUpdate)()
      })
      .onEnd(() => {
        rotation.value = withSpring(0, ANIMATED.SPRING_CONFIG, () => {
          runOnJS(onEnd)()
        })
      })

    const panGesture = Gesture.Pan()
      .onUpdate(event => {
        if (event.numberOfPointers > 1 && isPinching) {
          translateX.value = event.translationX
          translateY.value = event.translationY
        }
      })
      .onEnd(() => {
        translateX.value = withSpring(0, ANIMATED.SPRING_CONFIG)
        translateY.value = withSpring(0, ANIMATED.SPRING_CONFIG, () => {
          runOnJS(onEnd)()
        })
      })

    const composedGesture = Gesture.Simultaneous(
      pinchGesture,
      rotationGesture
      //   panGesture
    )

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${(rotation.value * 180) / Math.PI}deg` }
      ]
    }))

    return (
      <Pressable
        onLongPress={() => {
          setIsPinching(true)
        }}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[animatedStyle]}>{children}</Animated.View>
        </GestureDetector>
        {/* <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
            // backgroundColor: 'red'
          }}
        /> */}
      </Pressable>
    )
  }
)
