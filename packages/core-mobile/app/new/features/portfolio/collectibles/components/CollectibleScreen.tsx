import {
  alpha,
  AnimatedPressable,
  Icons,
  IndexPath,
  Pinchable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { Glow, GlowRef } from 'common/components/Glow'
import { DropdownSelection } from 'common/types'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { CollectibleGridItem } from 'features/portfolio/collectibles/components/CollectibleItem'
import {
  getCollectibleDescription,
  getCollectibleName,
  HORIZONTAL_MARGIN
} from 'features/portfolio/collectibles/consts'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Dimensions } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { useCollectiblesFilterAndSort } from '../hooks/useCollectiblesFilterAndSort'
import { CollectibleDetailsContent } from './CollectibleDetailsContent'
import { LinearGradient } from 'expo-linear-gradient'

export const VISIBLE_ITEM_WIDTH = 0.8
export const CAROUSEL_ITEM_GAP = 0
const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height
const CARD_SIZE = SCREEN_WIDTH * VISIBLE_ITEM_WIDTH + CAROUSEL_ITEM_GAP

const SNAP_DISTANCE = CARD_SIZE
const CARD_SIZE_MINIMUM = 120

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
  const {
    theme: { colors }
  } = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const { collectibles } = useCollectiblesContext()
  const { filteredAndSorted } = useCollectiblesFilterAndSort(collectibles)

  const [isExpanded, setIsExpanded] = useState(false)
  const scrollY = useSharedValue(0)

  const CAROUSEL_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom

  // const { sendNftBlockediOS, sendNftBlockedAndroid } = usePosthogContext()

  const currentIndex =
    filteredAndSorted?.findIndex(
      item => item.localId.toLowerCase() === localId?.toLowerCase()
    ) ?? 0
  const currentItem = useMemo(
    () => filteredAndSorted?.[currentIndex],
    [currentIndex, filteredAndSorted]
  )

  const headerRight = useCallback(
    (): ReactNode => (
      <CollectibleNavigation
        collectibles={filteredAndSorted}
        currentIndex={currentIndex}
      />
    ),
    [currentIndex, filteredAndSorted]
  )

  useEffect(() => {
    navigation.setOptions({
      headerRight
    })
  }, [navigation, currentIndex, filteredAndSorted, headerRight])

  // const canRefreshMetadata = useMemo(() => {
  //   const currentTimestamp = Math.floor(Date.now() / 1000)
  //   const refreshBackoff = 3600

  //   const updatedAt = collectible?.metadata?.lastUpdatedTimestamp

  //   return !updatedAt || currentTimestamp > updatedAt + refreshBackoff
  // }, [collectible])

  // const isRefreshing = useMemo(() => {
  //   if (!collectible) return false

  //   return isCollectibleRefreshing(collectible.localId)
  // }, [isCollectibleRefreshing, collectible])

  // const handleRefresh = useCallback(async (): Promise<void> => {
  //   if (!collectible) {
  //     return
  //   }

  //   await refreshMetadata(collectible, collectible.chainId)
  // }, [collectible, refreshMetadata])

  const scrollViewHandler = useAnimatedScrollHandler(event => {
    'worklet'
    scrollY.value = event.contentOffset.y
    runOnJS(setIsExpanded)(scrollY.value > SNAP_DISTANCE)
  })

  const topContentStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, CARD_SIZE_MINIMUM + 48],
      Extrapolation.CLAMP
    )

    return {
      height: CAROUSEL_HEIGHT,
      paddingBottom: insets.bottom,
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
      [0, -(CAROUSEL_HEIGHT - CARD_SIZE) / 2],
      Extrapolation.CLAMP
    )

    return {
      top: CAROUSEL_HEIGHT,
      left: 0,
      right: 0,
      height: CAROUSEL_HEIGHT - CARD_SIZE_MINIMUM - 70,
      transform: [
        {
          translateY
        }
      ]
    }
  })

  const scrollViewRef = useRef<Animated.ScrollView>(null)

  const onExpand = (): void => {
    scrollViewRef.current?.scrollToEnd({
      animated: true
    })
  }

  const expandStyle = useAnimatedStyle(() => {
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

  return (
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1
        }}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollViewHandler}
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 100
          }}
          contentContainerStyle={{
            paddingBottom: insets.bottom
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          overScrollMode="never"
          stickyHeaderIndices={[0]}
          nestedScrollEnabled>
          <View
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
              <CollectibleDetailsCard
                collectible={currentItem}
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
                  onPress={onExpand}
                  hitSlop={{
                    top: 34,
                    bottom: 34,
                    left: 4,
                    right: 4
                  }}>
                  <Icons.Custom.ArrowDownHandleBar
                    color={alpha(colors.$textPrimary, 0.6)}
                    width={40}
                    height={10}
                  />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                zIndex: 1000
              },
              contentStyle
            ]}>
            <CollectibleDetailsContent
              isExpanded={isExpanded}
              collectible={currentItem}
            />
          </Animated.View>

          <View style={{ height: CARD_SIZE + CAROUSEL_HEIGHT + 20 }} />
        </Animated.ScrollView>
      </View>
    </BlurredBarsContentLayout>
  )
}

export const CollectibleDetailsCard = ({
  collectible,
  scrollY
}: {
  collectible: NftItem
  scrollY: SharedValue<number>
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const glowRef = useRef<GlowRef>(null)

  const animateGlow = (): void => {
    glowRef.current?.startAnimation()
  }

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

  const cardStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [CARD_SIZE, CARD_SIZE_MINIMUM],
      Extrapolation.CLAMP
    )

    return {
      height: size,
      width: size
    }
  })

  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [1, 0.365],
      Extrapolation.CLAMP
    )
    return {
      transform: [{ scale }]
    }
  })

  return (
    <View
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <View
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Animated.View style={[cardStyle]}>
          <Pinchable
            onGestureEnd={animateGlow}
            style={{
              height: '100%',
              width: '100%'
            }}>
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: -1
                }
              ]}>
              <Glow
                ref={glowRef}
                size={(SCREEN_WIDTH - HORIZONTAL_MARGIN * 4) * 1.8}
              />
            </Animated.View>
            <CollectibleGridItem
              collectible={collectible}
              index={0}
              onLoaded={animateGlow}
              type={CollectibleView.LargeGrid}
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </Pinchable>
        </Animated.View>

        <View
          style={{
            position: 'relative',
            width: '100%'
          }}>
          <Animated.ScrollView
            style={[
              cardTitleStyle,
              {
                height: 170,
                width: '100%'
              }
            ]}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 50,
              paddingTop: 20
            }}
            showsVerticalScrollIndicator={false}>
            <View
              style={{
                width: CARD_SIZE
              }}>
              <Text
                variant="buttonMedium"
                style={{
                  fontSize: 12
                }}>
                {`${getCollectibleName(collectible)} #${collectible?.tokenId} `}

                <Text
                  sx={{
                    fontSize: 12,
                    color: '$textSecondary'
                  }}>
                  {getCollectibleDescription(collectible)}
                </Text>
              </Text>
            </View>
          </Animated.ScrollView>
          <LinearGradient
            colors={[
              alpha(colors.$surfacePrimary, 1),
              alpha(colors.$surfacePrimary, 0)
            ]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 40
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              alpha(colors.$surfacePrimary, 0),
              alpha(colors.$surfacePrimary, 1)
            ]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  )
}

const CollectibleNavigation = ({
  currentIndex,
  collectibles
}: {
  currentIndex: number
  collectibles: NftItem[]
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const navigation = useNavigation()

  const isFirst = currentIndex === 0
  const isLast = currentIndex === collectibles.length - 1

  const onPrevious = (): void => {
    if (isFirst) return
    navigation.setParams({
      // @ts-ignore
      localId: collectibles[currentIndex - 1].localId
    })
  }

  const onNext = (): void => {
    if (isLast) return
    if (collectibles[currentIndex + 1])
      navigation.setParams({
        // @ts-ignore
        localId: collectibles[currentIndex + 1].localId
      })
  }

  return (
    <View style={{ flexDirection: 'row', paddingRight: HORIZONTAL_MARGIN }}>
      <AnimatedPressable
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
      </AnimatedPressable>
      <AnimatedPressable
        style={{
          height: '100%'
        }}
        hitSlop={{
          top: 0,
          right: HORIZONTAL_MARGIN,
          bottom: 0,
          left: 0
        }}
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
      </AnimatedPressable>
    </View>
  )
}
