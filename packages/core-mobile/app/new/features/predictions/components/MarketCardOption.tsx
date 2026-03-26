import { Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { MarketCardThumbnail } from './MarketCardThumbnail'

export interface MarketOption {
  label: string
  imageUrl?: string | null
  probability: number // 0–1
}

export const MarketCardOption = ({
  option
}: {
  option: MarketOption
}): JSX.Element => {
  const isYes = option.label === 'Yes'
  const fillColor = isYes ? 'rgba(31,169,94,0.5)' : 'rgba(40,40,46,0.2)'
  const bgColor = isYes ? 'rgba(31,169,94,0.1)' : 'rgba(40,40,46,0.06)'

  return (
    <View
      key={option.label}
      style={{
        height: 24,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: bgColor
      }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${Math.round(option.probability * 100)}%`,
          backgroundColor: fillColor
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          top: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4
        }}>
        {option.imageUrl ? (
          <MarketCardThumbnail url={option.imageUrl} variant="small" />
        ) : null}
        <Text
          variant="caption"
          style={{ flex: 1, fontFamily: 'Inter-Medium' }}
          numberOfLines={1}>
          {option.label}
        </Text>
        <Text variant="buttonSmall">
          {Math.round(option.probability * 100)}%
        </Text>
      </View>
    </View>
  )
}
