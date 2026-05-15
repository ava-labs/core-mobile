import { Icons, useTheme } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import { Pressable } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { selectChartType, setChartType } from 'store/chartPreferences/slice'

type Props = {
  size?: number
}

export const ChartTypeToggle: FC<Props> = ({ size = 36 }) => {
  const { theme } = useTheme()
  const chartType = useSelector(selectChartType)
  const dispatch = useDispatch()

  const onPress = (): void => {
    dispatch(setChartType(chartType === 'line' ? 'candlestick' : 'line'))
  }

  const isCandle = chartType === 'candlestick'
  const bg = isCandle
    ? theme.colors.$textPrimary
    : theme.colors.$surfaceSecondary
  const fg = isCandle ? theme.colors.$surfacePrimary : theme.colors.$textPrimary

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch chart to ${
        isCandle ? 'line' : 'candlestick'
      } view`}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Icons.Custom.Candlestick color={fg} width={24} height={24} />
    </Pressable>
  )
}
