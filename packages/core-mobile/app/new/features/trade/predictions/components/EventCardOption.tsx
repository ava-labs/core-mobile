import { alpha, Text, useTheme, View } from '@avalabs/k2-alpine'
import { TradeThumbnail } from 'features/trade/components/TradeThumbnail'
import React from 'react'

export interface EventCardOption {
  label: string
  imageUrl?: string | null
  probability: number
}

export const EventCardOption = ({
  option
}: {
  option: EventCardOption
}): JSX.Element => {
  const { theme } = useTheme()
  const fillColor = alpha(theme.colors.$textPrimary, 0.2)
  const bgColor = alpha(theme.colors.$textPrimary, 0.1)

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
          paddingRight: 8,
          paddingLeft: option.imageUrl ? 4 : 8,
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          gap: 4
        }}>
        {option.imageUrl ? (
          <TradeThumbnail url={option.imageUrl} variant="small" />
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
