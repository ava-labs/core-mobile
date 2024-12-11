import { Pressable, SxProp, View } from 'dripsy'
import React, { useState } from 'react'
import { useDripsyTheme as useTheme } from 'dripsy'
import { FlatList, Text } from '../Primitives'
import Check from '../../assets/icons/check.svg'
import { Card } from '../../components/Card/Card'
import { Separator } from '../Separator/Separator'
import { RecoveryMethod, RecoveryMethodData } from './types'

export const RecoveryMethodList = ({
  data,
  sx,
  shouldShowSelected,
  onPress
}: {
  data: RecoveryMethodData[]
  sx?: SxProp
  shouldShowSelected?: boolean
  onPress: (type: RecoveryMethod) => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [selectedId, setSelectedId] = useState<string>()

  const renderItem = (item: RecoveryMethodData): React.JSX.Element => {
    const isSelected = shouldShowSelected && selectedId === item.type
    const isLastItem = data.indexOf(item) === data.length - 1
    const Icon = item.icon

    const handleOnPress = (): void => {
      shouldShowSelected && setSelectedId(item.type)
      onPress(item.type)
    }

    return (
      <Pressable
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 1,
          borderRadius: 12
        }}
        onPress={handleOnPress}>
        <View
          sx={{
            marginRight: 16,
            width: 22,
            height: 22,
            alignItems: 'center'
          }}>
          <Icon color={colors.$textPrimary} />
        </View>
        <View
          sx={{
            flex: 1
          }}>
          <View
            sx={{
              flex: 1,
              paddingRight: 17,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <View sx={{ flex: 1, marginRight: 25 }}>
              <Text
                sx={{
                  fontSize: 16,
                  fontWeight: '500',
                  lineHeight: 16,
                  color: colors.$textPrimary
                }}>
                {item.title}
              </Text>
              <Text
                sx={{
                  fontSize: 12,
                  fontWeight: '500',
                  lineHeight: 15,
                  color: colors.$textSecondary,
                  marginTop: 3
                }}>
                {item.description}
              </Text>
            </View>
            {isSelected ? (
              <Check width={15} color={colors.$textPrimary} />
            ) : (
              <View sx={{ width: 15 }} />
            )}
          </View>
          {!isLastItem && (
            <View sx={{ marginVertical: 12 }}>
              <Separator />
            </View>
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <Card sx={{ paddingRight: 0, ...sx }}>
      <FlatList
        sx={{ width: '100%', backgroundColor: '$surfaceSecondary' }}
        data={data}
        renderItem={item => renderItem(item.item as RecoveryMethodData)}
        keyExtractor={item => (item as RecoveryMethodData).type}
      />
    </Card>
  )
}
