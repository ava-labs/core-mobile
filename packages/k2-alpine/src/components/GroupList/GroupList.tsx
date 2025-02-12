import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, Text, TouchableOpacity } from '../Primitives'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../assets/tokenLogos/Icons'
import { useTheme } from '../../hooks'

export const GroupList = ({
  data,
  itemHeight
}: {
  data: GroupListItem[]
  itemHeight?: number
}): JSX.Element => {
  const { theme } = useTheme()
  const [textMarginLeft, setTextMarginLeft] = useState(0)

  const handleLayout = (event: LayoutChangeEvent): void => {
    setTextMarginLeft(event.nativeEvent.layout.x)
  }

  return (
    <View
      sx={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '$surfaceSecondary'
      }}>
      {data.map(({ leftIcon, title, value, accessory, onPress }, index) => (
        <View key={index}>
          <TouchableOpacity onPress={onPress}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: itemHeight
              }}>
              {leftIcon && <View sx={{ marginLeft: 16 }}>{leftIcon}</View>}
              <View
                sx={{
                  flexGrow: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginLeft: 15
                }}
                onLayout={handleLayout}>
                <Text
                  variant="buttonMedium"
                  sx={{
                    color: '$textPrimary',
                    paddingVertical: 14
                  }}>
                  {title}
                </Text>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 15,
                    gap: 4
                  }}>
                  {value !== undefined && (
                    <Text variant="body1" sx={{ color: '$textSecondary' }}>
                      {value}
                    </Text>
                  )}
                  {accessory !== undefined && accessory}
                  {accessory === undefined && onPress !== undefined && (
                    <Icons.Navigation.ChevronRight
                      color={theme.colors.$textSecondary}
                    />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
          {index < data.length - 1 && (
            <Separator sx={{ marginLeft: textMarginLeft }} />
          )}
        </View>
      ))}
    </View>
  )
}

export type GroupListItem = {
  title: string
  value?: string
  onPress?: () => void
  leftIcon?: JSX.Element
  accessory?: JSX.Element
}
