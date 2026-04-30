import type React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

export type SlideState = 'idle' | 'confirming' | 'error'

export type CommonProps = {
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  /** Fraction of max travel required to commit. Clamped to [0,1]. Defaults to 0.9. */
  threshold?: number
  /**
   * When true, renders a spinner while the button is awaiting commit. When
   * omitted or false the commit still runs (pill stays extended, haptics fire
   * on resolve) but no spinner is shown — use this when the parent is already
   * rendering its own loading indicator, or when the operation is fast enough
   * that a spinner would flash.
   */
  loading?: boolean
  /** Called when the commit handler rejects. Useful for surfacing errors. */
  onError?: (error: unknown) => void
}

export type ToneColors = {
  track: string
  thumbBackground: string
  thumbContent: string
  label: string
}

export type SingleProps = CommonProps & {
  mode: 'single'
  onConfirm: () => void | Promise<void>
  label: string
  color?: string
  leftIcon?: JSX.Element
}

/**
 * Render function that returns an icon in the given colour. Accepting a
 * render function (rather than a pre-rendered element) lets the component
 * swap the icon colour as the pill's background shifts underneath.
 */
export type BidirectionalIcon = (color: string) => React.ReactNode

export type BidirectionalProps = CommonProps & {
  mode: 'bidirectional'
  onConfirmLeft: () => void | Promise<void>
  onConfirmRight: () => void | Promise<void>
  leftLabel: string
  rightLabel: string
  leftColor?: string
  rightColor?: string
  leftIcon?: BidirectionalIcon
  rightIcon?: BidirectionalIcon
}

export type SlidingButtonProps = SingleProps | BidirectionalProps

export type TrackProps<P> = P & {
  state: SlideState
  translateX: SharedValue<number>
  maxTravel: number
  toneColors: ToneColors
  trackWidth: number
}
