import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icons, Logos, useTheme, View } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate
} from 'react-native-reanimated'
import { InteractionManager, LayoutChangeEvent } from 'react-native'
import { usePopSpringAnimation } from 'common/hooks/usePopSpringAnimation'

export const CoreLogoWithTokens = (): JSX.Element => {
  const selectedColorScheme = useSelector(selectSelectedColorScheme)

  const { animatedStyle: coreLogoAnimationStyle, pop: coreLogoPop } =
    usePopSpringAnimation({ minScale: 0.8 })

  const [center, setCenter] = useState({ cx: 0, cy: 0 })
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setCenter({ cx: width / 2, cy: height / 2 })
  }, [])
  const [startTokenAnimation, setStartTokenAnimation] = useState(false)

  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    InteractionManager.runAfterInteractions(() => {
      setStartTokenAnimation(true)
      coreLogoPop()
    })
  }, [coreLogoPop])

  return (
    <View
      sx={{
        width: '100%',
        height: 220,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onLayout={handleLayout}>
      {TOKEN_LOGOS.map(({ key, Icon, angleDeg, radius, size }) => {
        return (
          <TokenLogo
            key={key}
            Icon={Icon}
            cx={center.cx}
            cy={center.cy}
            angleDeg={angleDeg}
            radius={radius}
            size={size}
            delay={200}
            start={startTokenAnimation}
          />
        )
      })}
      <Animated.View
        style={[
          {
            borderRadius: 32,
            overflow: 'hidden',
            width: CORE_ICON_SIZE,
            height: CORE_ICON_SIZE
          },
          coreLogoAnimationStyle
        ]}>
        {selectedColorScheme === 'dark' ? (
          <Logos.AppIcons.CoreAppIconLight
            width={CORE_ICON_SIZE}
            height={CORE_ICON_SIZE}
          />
        ) : (
          <Logos.AppIcons.CoreAppIconDark
            width={CORE_ICON_SIZE}
            height={CORE_ICON_SIZE}
          />
        )}
      </Animated.View>
    </View>
  )
}

const TokenLogo = ({
  Icon,
  cx,
  cy,
  angleDeg,
  radius,
  size = 44,
  delay = 0,
  start
}: {
  Icon: React.ComponentType<{ width: number; height: number }>
  cx: number
  cy: number
  angleDeg: number
  radius: number
  size?: number
  delay?: number
  start: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const p = useSharedValue(0)

  useEffect(() => {
    if (start === false) return
    p.value = withDelay(
      delay,
      withSpring(1, { damping: 13, stiffness: 120, mass: 1 })
    )
  }, [delay, p, start])

  const rad = (angleDeg * Math.PI) / 180
  const targetX = Math.cos(rad) * radius
  const targetY = Math.sin(rad) * radius

  const style = useAnimatedStyle(() => {
    const tx = interpolate(p.value, [0, 1], [0, targetX])
    const ty = interpolate(p.value, [0, 1], [0, targetY])
    const scale = interpolate(p.value, [0, 0.4, 1], [0.2, 0.9, 1])
    const opacity = interpolate(p.value, [0, 0.1, 1], [0, 0.9, 1])
    return {
      position: 'absolute',
      left: cx - size / 2,
      top: cy - size / 2,
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 1000,
          overflow: 'hidden'
        },
        style
      ]}>
      <Icon width={size} height={size} />
      <View
        sx={{
          width: size,
          height: size,
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          borderRadius: 1000,
          borderWidth: 1,
          borderColor: theme.colors.$borderPrimary
        }}
      />
    </Animated.View>
  )
}

const TOKEN_LOGOS = [
  {
    key: 'AVAX',
    Icon: Icons.TokenLogos.AVAX,
    angleDeg: -143,
    radius: 120,
    size: 72
  },
  {
    key: 'USDT',
    Icon: Icons.TokenLogos.USDT,
    angleDeg: -168,
    radius: 189,
    size: 62
  },
  {
    key: 'ETH',
    Icon: Icons.TokenLogos.ETH1,
    angleDeg: -185,
    radius: 115,
    size: 62
  },
  {
    key: 'BTC',
    Icon: Icons.TokenLogos.BTC,
    angleDeg: -192,
    radius: 187,
    size: 51
  },
  {
    key: 'HYPE',
    Icon: Icons.TokenLogos.HYPE,
    angleDeg: -209,
    radius: 145,
    size: 32
  },
  {
    key: 'LINK',
    Icon: Icons.TokenLogos.LINK,
    angleDeg: -229,
    radius: 106,
    size: 42
  },
  {
    key: 'AAVE',
    Icon: Icons.TokenLogos.AAVE,
    angleDeg: 3,
    radius: 113,
    size: 62
  },
  {
    key: 'SOL',
    Icon: Icons.TokenLogos.SOL,
    angleDeg: 42,
    radius: 110,
    size: 47
  },
  {
    key: 'MATIC',
    Icon: Icons.TokenLogos.MATIC,
    angleDeg: -29,
    radius: 132,
    size: 42
  },
  {
    key: 'USDC',
    Icon: Icons.TokenLogos.USDC,
    angleDeg: -13,
    radius: 189,
    size: 62
  },
  {
    key: 'BNB',
    Icon: Icons.TokenLogos.BNB,
    angleDeg: 11,
    radius: 185,
    size: 51
  }
]

const CORE_ICON_SIZE = 110
