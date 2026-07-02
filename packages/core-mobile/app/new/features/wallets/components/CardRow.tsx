import { useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { CardPos } from '../utils/buildWalletListRows'

const RADIUS = 16
const INSET = 16
const GAP = 5
// A wallet's rows are separate FlashList cells but must look like one
// continuous card. On Android, cells are positioned at sub-pixel offsets that
// round to leave ~1px gaps between adjacent cells, through which the dark list
// background shows as black seams. Pulling each connecting row 1px into the
// next makes the card background overlap and cover the seam. (iOS rounds
// sub-pixels without gaps, so this is a no-op there.)
const SEAM_OVERLAP = 1

export const CardRow = ({
  cardPos,
  children
}: {
  cardPos: CardPos
  children: React.ReactNode
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const isTop = cardPos === 'top' || cardPos === 'single'
  const isBottom = cardPos === 'bottom' || cardPos === 'single'

  const style: StyleProp<ViewStyle> = {
    marginHorizontal: INSET,
    backgroundColor: colors.$surfacePrimary,
    borderColor: colors.$borderPrimary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: isTop ? 1 : 0,
    borderBottomWidth: isBottom ? 1 : 0,
    borderTopLeftRadius: isTop ? RADIUS : 0,
    borderTopRightRadius: isTop ? RADIUS : 0,
    borderBottomLeftRadius: isBottom ? RADIUS : 0,
    borderBottomRightRadius: isBottom ? RADIUS : 0,
    marginTop: isTop ? GAP : 0,
    // Bottom/single rows end a card (real inter-card gap); top/middle rows
    // continue into the next cell, so overlap them to hide the Android seam.
    marginBottom: isBottom ? GAP : -SEAM_OVERLAP,
    overflow: 'hidden'
  }

  return <View style={style}>{children}</View>
}
