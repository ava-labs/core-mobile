import React, { memo, useMemo } from 'react'
import Animated, { Keyframe } from 'react-native-reanimated'
import { ANIMATED } from '../../utils'

interface AnimateFadeScaleProps {
  children: React.ReactNode
  delay?: number
}

// Fade + scale the children in on mount via a declarative `entering` animation.
//
// The previous implementation started from an `opacity: 0` shared value and
// relied on a mount `useEffect` firing `withDelay(withTiming(1))` to reveal the
// content. That failed *invisible*: on the new architecture (RN 0.85 +
// reanimated 4.4) the effect-driven animation could be dropped before the Fabric
// view attached, and every value change remounted the node and restarted the
// fade — leaving characters stuck at opacity 0 (the "missing balance" / scattered
// blank digits in balances and price-change indicators, CP-14631).
//
// An `entering` animation is handled natively at mount instead of through a JS
// effect, and — critically — the view's resting style is fully visible. If the
// animation never runs (dropped, or a recycled cell that doesn't replay it) the
// content still shows. It fails *visible*.
const INITIAL_SCALE = 0.8

export const AnimateFadeScale = memo(
  ({ children, delay = 0 }: AnimateFadeScaleProps) => {
    const entering = useMemo(
      () =>
        new Keyframe({
          0: {
            opacity: 0,
            transform: [{ scale: INITIAL_SCALE }]
          },
          100: {
            opacity: 1,
            transform: [{ scale: 1 }],
            easing: ANIMATED.EASING
          }
        })
          .duration(ANIMATED.DURATION)
          .delay(delay),
      [delay]
    )

    return <Animated.View entering={entering}>{children}</Animated.View>
  }
)
