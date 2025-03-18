import React from 'react'
import { ImageBackground } from 'expo-image'
import { ImageSourcePropType } from 'react-native'
import { useInversedTheme, useTheme } from '../../hooks'
import { Button } from '../Button/Button'
import { Text, View } from '../Primitives'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'

export const CompletedCard = ({
  title,
  action,
  width = DEFAULT_CARD_WIDTH,
  backgroundImageSource
}: CompletedCardProps): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const height = getCardHeight(width)
  const backgroundColor = action ? undefined : theme.colors.$textPrimary

  return (
    <BaseCard
      sx={{
        paddingVertical: 20,
        paddingHorizontal: 18,
        backgroundColor,
        width,
        height
      }}>
      {action && backgroundImageSource && (
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
        <Text
          sx={{
            fontFamily: 'Aeonik-Bold',
            fontSize: 24,
            lineHeight: 22,
            color: inversedTheme.colors.$textPrimary
          }}>
          {title}
        </Text>
        {action && (
          <View onTouchStart={e => e.stopPropagation()}>
            <Button
              type="primary"
              size="small"
              style={{ minWidth: 72 }}
              shouldInverseTheme={true}
              onPress={action.onPress}>
              {action.title}
            </Button>
          </View>
        )}
      </View>
    </BaseCard>
  )
}

export type CompletedCardProps = {
  title: string
  action?: {
    title: string
    onPress: () => void
  }
  width?: number
  backgroundImageSource?: ImageSourcePropType
}
