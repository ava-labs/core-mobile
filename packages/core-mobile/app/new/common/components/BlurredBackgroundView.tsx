import React from 'react'
import { GlassView, Separator, View } from '@avalabs/k2-alpine'

const BlurredBackgroundView = ({
  separator
}: {
  separator?: {
    opacity: number
    position: 'top' | 'bottom'
  }
}): JSX.Element => {
  return (
    <View style={{ flex: 1 }}>
      {separator?.position === 'top' && (
        <Separator sx={{ opacity: separator.opacity }} />
      )}
      <GlassView style={{ flex: 1 }} />
      {separator?.position === 'bottom' && (
        <Separator sx={{ opacity: separator.opacity }} />
      )}
    </View>
  )
}

export default BlurredBackgroundView
