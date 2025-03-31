import React from 'react'
import { useInversedTheme, useTheme } from '../../../hooks'
import { View } from '../../Primitives'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'
import { Label } from './Label'

export const CompletedCard = ({
  title,
  width = DEFAULT_CARD_WIDTH,
  onPress
}: CompletedCardProps): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const height = getCardHeight(width)

  return (
    <BaseCard
      onPress={onPress}
      sx={{
        paddingVertical: 20,
        paddingHorizontal: 18,
        backgroundColor: theme.colors.$textPrimary,
        width,
        height
      }}>
      <View sx={{ gap: 11, alignItems: 'flex-start' }}>
        <Label
          sx={{
            color: inversedTheme.colors.$textPrimary
          }}>
          {title}
        </Label>
      </View>
    </BaseCard>
  )
}

export type CompletedCardProps = {
  title: string
  width?: number
  onPress?: () => void
}
