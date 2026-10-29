import { Platform } from 'react-native'
import {
  Easing,
  FadeInRight,
  FadeInUp,
  FadeOutUp
} from 'react-native-reanimated'

export const getItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInRight.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

// Reanimated 4.7.1 + RN 0.86 on Android can leave the view stuck at opacity 0
export const getListItemEnteringAnimation = (
  index: number
): FadeInUp | undefined =>
  Platform.OS === 'android'
    ? undefined
    : FadeInUp.duration(100)
        .delay(index * 50)
        .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
        .springify()

export const getListItemExitingAnimation = (index: number): FadeOutUp =>
  FadeOutUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()
