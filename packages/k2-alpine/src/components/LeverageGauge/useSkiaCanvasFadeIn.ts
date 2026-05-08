import { useEffect } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

/**
 * One-shot fade-in for a Skia canvas. `ready` is expected to be monotonic
 * (false → true once); flipping back to false will not reset the opacity.
 *
 * Two RAFs after `ready` flips true ensure React has committed and the
 * native Skia Canvas has ticked a first frame before we fade in — otherwise
 * the canvas can flash unstyled or unmeasured content during mount.
 */
export const useSkiaCanvasFadeIn = (ready: boolean) => {
  const opacity = useSharedValue(0)
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  useEffect(() => {
    if (!ready) return
    const cancelIds: { raf2?: number } = {}
    const raf1 = requestAnimationFrame(() => {
      cancelIds.raf2 = requestAnimationFrame(() => {
        opacity.value = withTiming(1, { duration: 300 })
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (cancelIds.raf2 !== undefined) cancelAnimationFrame(cancelIds.raf2)
    }
  }, [ready, opacity])

  return style
}
