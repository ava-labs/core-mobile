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

export const getListItemEnteringAnimation = (index: number): FadeInUp =>
  FadeInUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const getListItemExitingAnimation = (index: number): FadeOutUp =>
  FadeOutUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()
