import React from 'react'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'

export const PriceChangeIndicator = ({
  formattedPrice,
  status,
  formattedPercent,
  textVariant = 'buttonSmall'
}: {
  formattedPrice: string
  status: 'up' | 'down' | 'equal'
  formattedPercent?: string
  textVariant?: 'buttonMedium' | 'buttonSmall'
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const signIndicator = status === 'up' ? '+' : status === 'down' ? '-' : ''
  const iconMarginBottom = textVariant === 'buttonMedium' ? 3 : 2
  const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}>
      <View sx={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <MaskedView
          maskElement={
            <Text variant={textVariant}>
              {signIndicator}
              {formattedPrice}
            </Text>
          }>
          <View>
            <Text variant={textVariant} sx={{ opacity: 0 }}>
              {signIndicator}
              {formattedPrice}
            </Text>
            <LinearGradient
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
              colors={
                status === 'down'
                  ? ['#E84142', '#F6663B']
                  : status === 'up'
                  ? ['#1CC51D', '#47C4AF']
                  : [theme.colors.$textSecondary, theme.colors.$textSecondary]
              }
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
            />
          </View>
        </MaskedView>
        <View
          sx={{ marginBottom: iconMarginBottom, marginLeft: iconMarginLeft }}>
          {status === 'down' ? (
            <Icons.Custom.TrendingArrowDown
              color={'#F5643B'}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : (
            <Icons.Custom.TrendingArrowUp
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={
                status === 'equal' ? theme.colors.$textSecondary : '#42C49F'
              }
            />
          )}
        </View>
      </View>
      {formattedPercent !== undefined && (
        <Text
          variant={textVariant}
          sx={{
            color: status === 'equal' ? '$textSecondary' : '$textPrimary'
          }}>
          {formattedPercent}
        </Text>
      )}
    </View>
  )
}

const ICON_SIZE = 10
