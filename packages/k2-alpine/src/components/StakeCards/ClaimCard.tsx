import React from 'react'
import { ImageBackground } from 'expo-image'
import { ImageSourcePropType } from 'react-native'
import { useInversedTheme, useTheme } from '../../hooks'
import { Button } from '../Button/Button'
import { View } from '../Primitives'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'
import { Label } from './Label'

export const ClaimCard = ({
  title,
  width = DEFAULT_CARD_WIDTH,
  backgroundImageSource,
  onPress
}: ClaimCardProps): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const height = getCardHeight(width)

  return (
    <BaseCard
      onPress={onPress}
      sx={{
        paddingVertical: 20,
        paddingHorizontal: 18,
        width,
        height
      }}>
      {backgroundImageSource && (
        <ImageBackground
          style={{
            position: 'absolute',
            left: -5,
            right: -5,
            top: -5,
            bottom: -5
          }}
          source={backgroundImageSource}
        />
      )}
      <View sx={{ gap: 11, alignItems: 'flex-start' }}>
        <Label
          sx={{
            color: inversedTheme.colors.$textPrimary
          }}>
          {title}
        </Label>
        <View onTouchStart={e => e.stopPropagation()}>
          <Button
            type="primary"
            size="small"
            style={{ minWidth: 72 }}
            shouldInverseTheme={true}
            onPress={onPress}>
            Claim
          </Button>
        </View>
      </View>
    </BaseCard>
  )
}

export type ClaimCardProps = {
  title: string
  width?: number
  backgroundImageSource: ImageSourcePropType
  onPress?: () => void
}
