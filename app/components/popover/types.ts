import { View, ViewProps } from 'react-native'
import { Ref } from 'react'
import { PopableManager } from './usePopable'

export type PopableProps = {
  animated?: PopoverProps['animated']
  animationType?: PopoverProps['animationType']
  backgroundColor?: PopoverProps['backgroundColor']
  caret?: PopoverProps['caret']
  caretPosition?: PopoverProps['caretPosition']
  children: PopoverProps['children']
  content: PopoverProps['children']
  numberOfLines?: PopoverProps['numberOfLines']
  onAction?: (visible: boolean) => void
  position?: PopoverProps['position']
  strictPosition?: boolean
  style?: PopoverProps['style']
  visible?: boolean
  wrapperStyle?: ViewProps['style']
  ref?: Ref<PopableManager>
}

export type PopoverProps = {
  animated?: boolean
  animationType?: 'spring' | 'timing'
  backgroundColor?: string
  caret?: boolean
  caretPosition?: 'left' | 'center' | 'right'
  children: string | React.ReactElement
  forceInitialAnimation?: boolean
  numberOfLines?: number
  visible?: boolean
  position?: 'top' | 'right' | 'bottom' | 'left'
  ref?: Ref<View>
} & ViewProps
