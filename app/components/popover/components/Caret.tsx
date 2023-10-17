import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import type { PopoverProps } from '../types'
import { BORDER_RADIUS, CARET_SIDE_SIZE } from '../constants'

export type CaretProps = {
  backgroundColor?: string
  align: 'left' | 'center' | 'right'
  position: PopoverProps['position']
  style?: ViewProps['style']
}

export const Caret = ({
  align,
  backgroundColor,
  position,
  style
}: CaretProps): JSX.Element => {
  return (
    <View
      style={[
        styles.container,
        align === 'center' && styles.containerCenter,
        align === 'right' && styles.containerRight,
        { backgroundColor },
        position === 'top' && styles.containerPositionTop,
        position === 'bottom' && styles.containerPositionBottom,
        position === 'left' && styles.containerPositionLeft,
        position === 'right' && styles.containerPositionRight,
        style
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    width: CARET_SIDE_SIZE,
    height: CARET_SIDE_SIZE,
    transform: [{ rotate: '45deg' }],
    borderRadius: BORDER_RADIUS
  },
  containerPositionTop: {
    marginTop: (CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2) * -1,
    marginBottom: CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2
  },
  containerPositionBottom: {
    marginBottom: (CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2) * -1,
    marginTop: CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2
  },
  containerPositionLeft: {
    marginLeft: (CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2) * -1,
    marginRight: CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2
  },
  containerPositionRight: {
    marginRight: (CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2) * -1,
    marginLeft: CARET_SIDE_SIZE / 2 + BORDER_RADIUS / 2
  },
  containerCenter: {
    alignSelf: 'center'
  },
  containerRight: {
    alignSelf: 'flex-end'
  }
})
