import React from 'react'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View, useTheme } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'

export const PriceChangeIndicator = ({
  price,
  formattedPercent,
  textVariant = 'buttonSmall'
}: {
  price?: number
  formattedPercent?: string
  textVariant?: 'buttonMedium' | 'buttonSmall'
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const formattedPrice =
    price === undefined
      ? UNKNOWN_AMOUNT
      : price > 0
      ? '+' + price?.toFixed(2)
      : price?.toFixed(2)

  const isPositive = price && price > 0
  const isEqual = price === 0
  //   const iconMarginBottom = textVariant === 'buttonMedium' ? 3 : 2
  //   const iconMarginLeft = formattedPercent === undefined ? 4 : 1

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}>
      <View sx={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <MaskedView
          maskElement={<Text variant={textVariant}>{formattedPrice}</Text>}>
          <View>
            <Text variant={textVariant} sx={{ opacity: 0 }}>
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
                !isPositive
                  ? [theme.colors.$textDanger, '#F6663B']
                  : isPositive
                  ? [theme.colors.$textSuccess, '#47C4AF']
                  : [theme.colors.$textSecondary, theme.colors.$textSecondary]
              }
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
            />
          </View>
        </MaskedView>
        {/* <View
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
        </View> */}
      </View>
      {formattedPercent !== undefined && (
        <Text
          variant={textVariant}
          sx={{
            color: isEqual ? '$textSecondary' : '$textPrimary'
          }}>
          {formattedPercent}
        </Text>
      )}
    </View>
  )
}
