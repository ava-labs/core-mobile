import { Easing, FadeInRight, FadeInUp } from 'react-native-reanimated'

export enum ActionButtonTitle {
  Send = 'Send',
  Swap = 'Swap',
  Buy = 'Buy',
  Stake = 'Stake',
  Bridge = 'Bridge',
  Connect = 'Connect'
}

export const LIST_ITEM_HEIGHT = 60
export const GRID_ITEM_HEIGHT = 170

export const getItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInRight.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const getListItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const SEGMENT_CONTROL_HEIGHT = 40
