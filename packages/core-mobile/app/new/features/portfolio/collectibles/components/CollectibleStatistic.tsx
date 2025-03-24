import { alpha, Text, useTheme, View } from '@avalabs/k2-alpine'
import React, { memo, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

export type IStatistic = {
  text?: string
  value?: number | string
  inline?: boolean
}

export type StatisticProps = {
  style?: StyleProp<ViewStyle>
} & IStatistic

export const StatisticGroup = ({
  children
}: {
  children: ReactNode
}): ReactNode => {
  const { theme } = useTheme()
  return (
    <View
      style={{
        backgroundColor: alpha(theme.colors.$textPrimary, 0.08),
        borderRadius: 12,
        paddingLeft: 15
      }}>
      {React.Children.map(children, (child, index) => {
        return (
          <View
            sx={{
              borderBottomWidth:
                React.Children.count(children) - 1 === index ? 0 : 1,
              borderBottomColor: '$borderPrimary',
              minHeight: 44,
              justifyContent: 'center',
              paddingRight: 15
            }}>
            {child}
          </View>
        )
      })}
    </View>
  )
}

export const Statistic = memo(
  ({ text, value, style, inline }: StatisticProps) => {
    return (
      <View
        style={[
          inline
            ? {
                gap: 12,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between'
              }
            : {
                gap: 4,
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start'
              },
          style
        ]}>
        <Text
          // TODO: Add Inter-Medium font to the theme? ask design
          sx={{
            color: '$textPrimary'
          }}>
          {text}
        </Text>
        <Text
          sx={{
            color: '$textSecondary',
            flex: 1,
            textAlign: 'right'
          }}
          numberOfLines={1}>
          {value}
        </Text>
      </View>
    )
  }
)
