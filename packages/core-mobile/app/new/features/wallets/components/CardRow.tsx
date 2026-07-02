import { useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { CardPos } from '../utils/buildWalletListRows'

const RADIUS = 16
const INSET = 16
const GAP = 5

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
    marginBottom: isBottom ? GAP : 0,
    overflow: 'hidden'
  }

  return <View style={style}>{children}</View>
}
