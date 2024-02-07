import React from 'react'
import { View } from '../..'

export type DividerLineType = 'regular' | 'prominent'

interface DividerLineProps {
  type?: DividerLineType
}

export function DividerLine(
  { type }: DividerLineProps = { type: 'regular' }
): JSX.Element {
  return (
    <View
      sx={{
        backgroundColor: type === 'prominent' ? '$neutral500' : '$neutral800',
        marginVertical: 8,
        height: 1
      }}
    />
  )
}
