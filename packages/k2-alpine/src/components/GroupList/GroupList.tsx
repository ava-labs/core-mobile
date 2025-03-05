import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, Text, TouchableOpacity } from '../Primitives'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../theme/tokens/Icons'
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
      {data.map(
        (
          {
            leftIcon,
            rightIcon,
            title,
            value,
            accessory,
            onPress,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onLongPress = () => {}
          },
          index
        ) => (
          <View key={index}>
            <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
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
                  <View
                    sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      variant="buttonMedium"
                      sx={{
                        color: '$textPrimary',
                        paddingVertical: 14
                      }}>
                      {title}
                    </Text>
                    {rightIcon !== undefined && rightIcon}
                  </View>
                  <View
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginRight: 15,
                      gap: 4,
                      flexShrink: 1
                    }}>
                    {value !== undefined && (
                      <Text
                        variant="body1"
                        numberOfLines={1}
                        sx={{ color: '$textSecondary' }}>
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
        )
      )}
    </View>
  )
}

export type GroupListItem = {
  title: string
  value?: string
  onPress?: () => void
  onLongPress?: () => void
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  accessory?: JSX.Element
}
