import React from 'react'
import { View, Text, TouchableHighlight } from '../Primitives'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'

export const GroupList = ({ data }: { data: GroupListItem[] }): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ borderRadius: 12, overflow: 'hidden' }}>
      {data.map(({ title, value, accessory, onPress }, index) => (
        <View key={index}>
          <TouchableHighlight onPress={onPress}>
            <View
              sx={{
                backgroundColor: '$surfaceSecondary',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Text
                variant="body1"
                sx={{
                  color: '$textPrimary',
                  paddingVertical: 14,
                  marginLeft: 15
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
          </TouchableHighlight>
          {index < data.length - 1 && <Separator sx={{ marginLeft: 15 }} />}
        </View>
      ))}
    </View>
  )
}

export type GroupListItem = {
  title: string
  value?: string
  onPress?: () => void
  accessory?: JSX.Element
}
