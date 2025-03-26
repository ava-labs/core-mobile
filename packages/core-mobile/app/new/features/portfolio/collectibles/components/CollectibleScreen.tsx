import {
  alpha,
  Icons,
  Pinchable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { ErrorState } from 'common/components/ErrorState'
import { Glow, GlowRef } from 'common/components/Glow'
import { LinearGradient } from 'expo-linear-gradient'
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
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import {
  CollectibleFilterAndSortInitialState,
  useCollectiblesFilterAndSort
} from '../hooks/useCollectiblesFilterAndSort'
import { CollectibleDetailsContent } from './CollectibleDetailsContent'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height
const CARD_SIZE = SCREEN_WIDTH - HORIZONTAL_MARGIN * 4
const SNAP_DISTANCE = CARD_SIZE
const CARD_SIZE_SMALL = 120

type CollectibleScreenRouteParams = {
  localId?: string
  initial?: CollectibleFilterAndSortInitialState
}

export const CollectibleScreen = ({
  localId,
  initial
}: CollectibleScreenRouteParams): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const { collectibles } = useCollectiblesContext()
  const { filteredAndSorted } = useCollectiblesFilterAndSort(
    collectibles,
    initial
  )

  const [isExpanded, setIsExpanded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(
    filteredAndSorted?.findIndex(
      item => item.localId.toLowerCase() === localId?.toLowerCase()
    ) ?? -1
  )

  const scrollY = useSharedValue(0)
  const CONTENT_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom
  const scrollViewRef = useRef<Animated.ScrollView>(null)

  const collectible = useMemo(
    () => filteredAndSorted[currentIndex],
    [currentIndex, filteredAndSorted]
  )

  const isFirst = currentIndex === 0
  const isLast = currentIndex === filteredAndSorted.length - 1

  const scrollViewHandler = useAnimatedScrollHandler(event => {
    'worklet'
    scrollY.value = event.contentOffset.y
    runOnJS(setIsExpanded)(scrollY.value > SNAP_DISTANCE)
  })

  const onExpand = (): void => {
    scrollViewRef.current?.scrollToEnd({
      animated: true
    })
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
      headerRight
    })
  }, [navigation, currentIndex, filteredAndSorted, headerRight])

  const topContentStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [0, CARD_SIZE_SMALL + 48],
      Extrapolation.CLAMP
    )

    return {
      height: CONTENT_HEIGHT,
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
      [0, -(CONTENT_HEIGHT - CARD_SIZE) / 2],
      Extrapolation.CLAMP
    )

    return {
      top: CONTENT_HEIGHT,
      left: 0,
      right: 0,
      height: CONTENT_HEIGHT - CARD_SIZE_SMALL - 70,
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

  const onBack = useCallback((): void => {
    navigation.goBack()
  }, [navigation])

  const renderEmpty = useMemo((): ReactNode => {
    return (
      <ErrorState
        sx={{ height: CONTENT_HEIGHT }}
        title={`Oops\nThis collectible could not be loaded`}
        description="Please hit refresh or try again later"
        button={{
          title: 'Go back',
          onPress: onBack
        }}
      />
    )
  }, [CONTENT_HEIGHT, onBack])

  return (
    <BlurredBarsContentLayout>
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
                collectibles={filteredAndSorted}
                isExpanded={isExpanded}
                collectible={collectible}
              />
            </Animated.View>

            <View style={{ height: CARD_SIZE + CONTENT_HEIGHT + 20 }} />
          </Animated.ScrollView>
        ) : (
          renderEmpty
        )}
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

  const opacityStyle = useAnimatedStyle(() => {
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

  const cardStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, SNAP_DISTANCE],
      [CARD_SIZE, CARD_SIZE_SMALL],
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
        <Animated.View
          style={[
            cardStyle,
            {
              zIndex: 1000,
              position: 'relative'
            }
          ]}>
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
              <Glow ref={glowRef} size={CARD_SIZE * 1.8} />
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
            width: '100%',
            zIndex: 1
          }}>
          <Animated.ScrollView
            style={[
              opacityStyle,
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
