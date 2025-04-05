import {
  alpha,
  Pinchable,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode } from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { NftContentType } from 'store/nft'
import {
  getCollectibleDescription,
  getCollectibleName,
  HORIZONTAL_MARGIN
} from '../consts'
import { CollectibleGridItem } from './CollectibleItem'

export const CARD_SIZE = SCREEN_WIDTH - HORIZONTAL_MARGIN * 4
export const CARD_SIZE_SMALL = 120
export const SNAP_DISTANCE = 160

export const CollectibleDetailsHero = ({
  collectible,
  scrollY
}: {
  collectible: NftItem
  scrollY: SharedValue<number>
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  // TODO: add lottie animation instead of custom glow
  // const glowRef = useRef<GlowRef>(null)

  const animateGlow = (): void => {
    // glowRef.current?.startAnimation()
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

  // const glowStyle = useAnimatedStyle(() => {
  //   const scale = interpolate(
  //     scrollY.value,
  //     [0, SNAP_DISTANCE],
  //     [1, 0.365],
  //     Extrapolation.CLAMP
  //   )

  //   return {
  //     transform: [{ scale }]
  //   }
  // })

  return (
    <View
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 32
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
            disabled={
              collectible.status !== NftLocalStatus.Processed ||
              collectible.imageData?.type === NftContentType.MP4
            }>
            {/* TODO: add lottie instead of custom glow animation */}
            {/* <Animated.View
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
              <Glow ref={glowRef} size={CARD_SIZE * 1.6} />
            </Animated.View> */}

            <CollectibleGridItem
              collectible={collectible}
              index={0}
              onLoaded={animateGlow}
              type={CollectibleView.LargeGrid}
              style={{
                width: '100%',
                height: '100%'
              }}
              rendererProps={{
                videoProps: {
                  autoPlay: true,
                  muted: true
                }
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
            nestedScrollEnabled
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
              height: 30
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
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
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  )
}
